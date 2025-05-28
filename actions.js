module.exports = function (self) {
	self.setActionDefinitions({
		toggle: {
			name: 'Toggle State',
			options: [
				{
					id: 'id',
					type: 'textinput',
					label: 'ID',
					default: '1',
				},
			],
			callback: async (event) => {
				if (self.socket && self.socket.connected) {
					self.socket.emit('toggle_state', { id: event.options.id })
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
	})
}
