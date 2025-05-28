const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		RaceReadyState: {
			name: 'Race Ready Action State',
			type: 'boolean',
			label: 'Race Ready Action State',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'id',
					type: 'textinput',
					label: 'ID',
					default: "1",
				},
			],
			callback: (feedback) => {
				// Handle feedback updates dynamically
				//self.log('info', `Feedback triggered for ID: ${feedback.options.id}`)
				// self.log('info', `Current state: ${JSON.stringify(self.state)}`)
				// self.log('info', `State for ID ${feedback.options.id}: ${self.state[feedback.options.id]}`)
				// Placeholder logic for updates
				return self.state[feedback.options.id]["status"]
			},
		},
		RaceReadyOverallState: {
			name: 'Race Ready Overall State',
			type: 'boolean',
			label: 'Race Ready Overall State',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (feedback) => {

				for (const key in self.state) {
					if (self.state[key]["status"] === false) {
						return false // If any action is not ready, overall state is false
					}
				}
				// If all actions are ready, return true
				return true
			},
		},
	})
}
