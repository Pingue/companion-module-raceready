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
		this.state = {} 
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)

		this.connectSocket() // Establish WebSocket connection
		this.updateActions() // Export actions
		this.updateFeedbacks() // Export feedbacks
		this.updateVariableDefinitions() // Export variable definitions
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
			})

			this.socket.on('disconnect', () => {
				this.log('warn', `Disconnected from WebSocket at ${url}`)
			})

			this.socket.on('connect_error', (error) => {
				this.log('error', `WebSocket connection error: ${error.message}`)
				})

			// Trigger feedback updates based on WebSocket events
			this.socket.onAny((event, ...args) => {
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
			})
		} else {
			this.log('warn', 'Host or port not configured. WebSocket connection not established.')
		}
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
}

runEntrypoint(ModuleInstance, UpgradeScripts)
