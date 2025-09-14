const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const { io } = require('socket.io-client') // Import socket.io-client
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.socket = null // Initialize socket variable
		this.state = {} // Legacy state for actions by ID
		this.checklists = [] // Array of checklist objects {id, name}
		this.currentChecklistId = null // ID of the currently active checklist
		this.checklistActions = {} // Actions organized by checklist_id, then by normalised_index
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)

		this.connectSocket() // Establish WebSocket connection
		this.updateActions() // Export actions
		this.updateFeedbacks() // Export feedbacks
		this.updateVariableDefinitions() // Export variable definitions
		
		// Request initial data from the remote app
		if (this.socket && this.socket.connected) {
			this.socket.emit('request_all_data')
			this.socket.emit('get_current_checklist')
		}
	}

	async destroy() {
		this.log('debug', 'destroy')
		if (this.socket) {
			this.socket.disconnect() // Disconnect WebSocket on destroy
		}
	}

	async configUpdated(config) {
		this.config = config
		this.connectSocket() // Reconnect WebSocket when config changes
	}

	connectSocket() {
		if (this.socket) {
			this.socket.disconnect() // Disconnect existing socket
		}

		const { host, port } = this.config
		if (host && port) {
			const url = `http://${host}:${port}`
			this.socket = io(url)

			this.socket.on('connect', () => {
				this.log('info', `Connected to WebSocket at ${url}`)
				this.socket.emit('request_all_data')
				this.socket.emit('get_current_checklist')
				this.socket.emit('get_checklists')
				this.updateStatus(InstanceStatus.Ok) // Set status to OK when connected
			})

			this.socket.on('disconnect', () => {
				this.log('warn', `Disconnected from WebSocket at ${url}`)
				this.updateStatus(InstanceStatus.Disconnected) // Update status to disconnected
			})

			this.socket.on('connect_error', (error) => {
				this.log('error', `WebSocket connection error: ${error.message}`)
				this.updateStatus(InstanceStatus.Error, 'Connection failed. Check IP/Port configuration.') // Update status to error
				})

			// Handle specific events for checklist management
			this.socket.on('checklists', (data) => {
				this.log('info', `Received checklists: ${JSON.stringify(data)}`)
				this.processChecklistsData(data)
			})

			this.socket.on('current_checklist', (data) => {
				this.log('info', `Received current checklist: ${JSON.stringify(data)}`)
				this.currentChecklistId = data.current_checklist_id
				// Request fresh data when checklist changes
				this.socket.emit('request_all_data')
				this.updateVariableDefinitions() // Update variables when active checklist changes
				this.checkFeedbacks('CurrentChecklistName', 'CurrentChecklistIndex', 'RaceReadyState', 'RaceReadyOverallState')
			})

			this.socket.on('all_data', (data) => {
				this.log('info', `Received all_data: ${JSON.stringify(data)}`)
				this.processAllData(data)
			})

			this.socket.on('partial_data', (data) => {
				this.log('info', `Received partial_data: ${JSON.stringify(data)}`)
				this.processPartialData(data)
			})

			// Trigger feedback updates based on WebSocket events
			this.socket.onAny((event, ...args) => {
				// Handle legacy format for backwards compatibility during transition
				if (event !== 'checklists' && event !== 'current_checklist' && event !== 'all_data' && event !== 'partial_data') {
					//this.log('info', `Received event: ${event}, Data: ${JSON.stringify(args)}`)
					for (const key in args[0]) {
						var actionid = args[0][key]["id"]
						if (actionid === undefined) {
							continue
						}
						var actionstatus = args[0][key]["status"]
						var actiontext = args[0][key]["text"]
						this.state[actionid] = {"status": !!actionstatus, "text": actiontext}
					}
					// Trigger feedback update for RaceReadyState
					this.checkFeedbacks('RaceReadyState', 'RaceReadyOverallState')
					// Update variable definitions
					var alltexts = {}
					for (const key in this.state) {
						alltexts["actiontext"+key] = this.state[key]["text"]
					}
					this.setVariableValues(alltexts)
				}
			})
		} else {
			this.log('warn', 'Host or port not configured. WebSocket connection not established.')
			this.updateStatus(InstanceStatus.BadConfig, 'Host or port not configured.') // Update status to bad config
		}
	}

	processAllData(data) {
		// Clear existing checklist actions
		this.checklistActions = {}
		
		this.log('info', `Processing all_data with ${data.length} actions`)
		
		// Infer current checklist from the data
		if (data.length > 0) {
			this.currentChecklistId = data[0].checklist_id
			this.log('info', `Current checklist ID: ${this.currentChecklistId}`)
		}
		
		// Process each action and organize by checklist_id and normalised_index
		data.forEach(action => {
			const checklistId = action.checklist_id
			const normalisedIndex = action.normalised_index
			
			if (!this.checklistActions[checklistId]) {
				this.checklistActions[checklistId] = {}
			}
			
			this.checklistActions[checklistId][normalisedIndex] = {
				id: action.id,
				text: action.text,
				order: action.order,
				status: !!action.status,
				normalisedIndex: normalisedIndex
			}
		})
		
		// Request checklist names if we don't have them
		if (this.checklists.length === 0) {
			this.log('info', 'Requesting checklists data')
			this.socket.emit('get_checklists')
		}
		
		// Update variables and feedbacks
		this.updateChecklistVariables()
		this.checkFeedbacks('RaceReadyState', 'RaceReadyOverallState', 'ActionNameByPosition', 'CurrentChecklistName', 'CurrentChecklistIndex')
	}
	
	processPartialData(data) {
		// Process partial data updates for individual actions
		data.forEach(action => {
			const checklistId = action.checklist_id
			const normalisedIndex = action.normalised_index
			
			// Update current checklist ID if we don't have one or if it's different
			if (!this.currentChecklistId || this.currentChecklistId !== checklistId) {
				this.log('info', `Updating current checklist from partial_data: ${this.currentChecklistId} -> ${checklistId}`)
				this.currentChecklistId = checklistId
			}
			
			// Initialize checklist if it doesn't exist
			if (!this.checklistActions[checklistId]) {
				this.checklistActions[checklistId] = {}
			}
			
			// Update the specific action
			this.checklistActions[checklistId][normalisedIndex] = {
				id: action.id,
				text: action.text,
				order: action.order,
				status: !!action.status,
				normalisedIndex: normalisedIndex
			}
		})
		
		// Update variables and feedbacks
		this.updateChecklistVariables()
		this.checkFeedbacks('RaceReadyState', 'RaceReadyOverallState', 'ActionNameByPosition', 'CurrentChecklistName', 'CurrentChecklistIndex')
	}
	
	updateChecklistVariables() {
		const variables = {}
		
		// Add checklist info variables
		variables['current_checklist_name'] = this.getCurrentChecklistName()
		variables['current_checklist_index'] = this.getCurrentChecklistIndex()
		variables['total_checklists'] = this.checklists.length
		
		// Add position-based action text variables for current checklist
		if (this.currentChecklistId && this.checklistActions[this.currentChecklistId]) {
			const currentActions = this.checklistActions[this.currentChecklistId]
			Object.keys(currentActions).forEach(normalisedIndex => {
				const action = currentActions[normalisedIndex]
				variables[`actiontext_pos${normalisedIndex}`] = action.text
			})
		}
		
		this.setVariableValues(variables)
	}
	
	getCurrentChecklistName() {
		const checklist = this.checklists.find(cl => cl.id === this.currentChecklistId)
		return checklist ? checklist.name : 'Unknown'
	}
	
	getCurrentChecklistIndex() {
		const index = this.checklists.findIndex(cl => cl.id === this.currentChecklistId)
		return index >= 0 ? index : -1
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 8,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 4,
				regex: Regex.PORT,
			},
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	processChecklistsData(data) {
		if (data && Array.isArray(data)) {
			this.checklists = data
			this.log('info', `Loaded ${data.length} checklists`)
		} else {
			this.log('warn', `Unexpected checklists data format: ${JSON.stringify(data)}`)
			this.checklists = []
		}
		this.updateVariableDefinitions()
		this.updateChecklistVariables()
		this.checkFeedbacks('CurrentChecklistName', 'CurrentChecklistIndex')
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
