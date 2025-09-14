const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		RaceReadyState: {
			name: 'Race Ready Action State by Position',
			type: 'boolean',
			label: 'Race Ready Action State by Position',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'position',
					type: 'number',
					label: 'Position (1-based index)',
					default: 1,
					min: 1,
					max: 50,
				},
			],
			callback: (feedback) => {
				// Get action at specified position in current checklist
				const position = feedback.options.position
				
				if (self.currentChecklistId && self.checklistActions[self.currentChecklistId]) {
					const action = self.checklistActions[self.currentChecklistId][position]
					return action ? action.status : false
				}
				return false
			},
		},
		RaceReadyOverallState: {
			name: 'Race Ready Overall State (Current Checklist)',
			type: 'boolean',
			label: 'Race Ready Overall State (Current Checklist)',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (feedback) => {
				// Check if all actions in current checklist are complete
				if (self.currentChecklistId && self.checklistActions[self.currentChecklistId]) {
					const currentActions = self.checklistActions[self.currentChecklistId]
					for (const position in currentActions) {
						if (currentActions[position].status === false) {
							return false // If any action is not ready, overall state is false
						}
					}
					return Object.keys(currentActions).length > 0 // Return true only if there are actions and all are complete
				}
				return false
			},
		},
		CurrentChecklistName: {
			name: 'Current Checklist Name',
			type: 'advanced',
			label: 'Current Checklist Name',
			defaultStyle: {
				bgcolor: combineRgb(0, 0, 255),
				color: combineRgb(255, 255, 255),
			},
			callback: (feedback) => {
				// Find checklist directly in the feedback
				const checklist = self.checklists && self.checklists.find ? self.checklists.find(cl => cl.id === self.currentChecklistId) : null
				const name = checklist ? checklist.name : 'Unknown'
				
				return {
					text: name
				}
			},
		},
		CurrentChecklistIndex: {
			name: 'Current Checklist Index',
			type: 'advanced',
			label: 'Current Checklist Index',
			defaultStyle: {
				bgcolor: combineRgb(128, 0, 128),
				color: combineRgb(255, 255, 255),
			},
			callback: (feedback) => {
				// Find checklist index directly in the feedback
				const index = self.checklists.findIndex(cl => cl.id === self.currentChecklistId)
				
				return {
					text: index >= 0 ? `${index + 1}/${self.checklists.length}` : 'N/A'
				}
			},
		},
		ActionNameByPosition: {
			name: 'Action Name by Position',
			type: 'advanced',
			label: 'Action Name by Position',
			defaultStyle: {
				bgcolor: combineRgb(64, 64, 64),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'position',
					type: 'number',
					label: 'Position (1-based index)',
					default: 1,
					min: 1,
					max: 50,
				},
			],
			callback: (feedback) => {
				// Get action name at specified position in current checklist
				const position = feedback.options.position
				
				if (self.currentChecklistId && self.checklistActions[self.currentChecklistId]) {
					const action = self.checklistActions[self.currentChecklistId][position]
					return {
						text: action ? action.text : ''
					}
				}
				return {
					text: 'No Checklist'
				}
			},
		},
	})
}
