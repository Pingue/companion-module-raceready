module.exports = function (self) {
	self.setActionDefinitions({
		toggle: {
			name: 'Toggle Action by Position',
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
			callback: async (event) => {
				if (self.socket && self.socket.connected) {
					// Send the position directly (1-based) to match normalised_index
					const normalised_index = event.options.position
					self.log('info', `Toggle action triggered: position=${event.options.position}, sending normalised_index=${normalised_index}`)
					self.socket.emit('toggle_state_by_normalised', { normalised_index: normalised_index })
				} else {
					self.log('error', 'WebSocket is not connected')
				}
			},
		},
		reset_all: {
			name: 'Reset All',
			options: [],
			callback: async () => {
				if (self.socket && self.socket.connected) {
					self.socket.emit('reset_all')
				} else {
					self.log('error', 'WebSocket is not connected')
				}
			},
		},
		next_checklist: {
			name: 'Next Checklist',
			options: [],
			callback: async () => {
				if (self.socket && self.socket.connected) {
					self.socket.emit('next_checklist')
				} else {
					self.log('error', 'WebSocket is not connected')
				}
			},
		},
		previous_checklist: {
			name: 'Previous Checklist',
			options: [],
			callback: async () => {
				if (self.socket && self.socket.connected) {
					self.socket.emit('previous_checklist')
				} else {
					self.log('error', 'WebSocket is not connected')
				}
			},
		},
	})
}
