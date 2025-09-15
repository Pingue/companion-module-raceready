# Companion Module for RaceReady

A Bitfocus Companion module that provides real-time integration with [RaceReady](https://github.com/Pingue/raceready), enabling streamlined checklist management and race preparation through Stream Deck or other Companion-compatible devices.

## Features

### 🏁 Multi-Checklist Support
- Navigate between multiple checklists with dedicated next/previous actions
- Unique action references within each checklist
- Real-time checklist switching and state management

### ✅ Action Controls
- **Toggle Action by Position**: Toggle completion status of actions using their position in the current checklist
- **Reset All**: Clear all action states in the current checklist
- **Next/Previous Checklist**: Navigate between available checklists

### 📊 Real-Time Feedbacks
- **Action State by Position**: Visual feedback showing completion status (green/red)
- **Action Name by Position**: Display the text of actions at specific positions
- **Current Checklist Name**: Shows the name of the currently active checklist
- **Current Checklist Index**: Shows current position (e.g., "2/5")
- **Overall State**: Indicates if all actions in the current checklist are complete

### 🔢 Variables
- `$(raceready:current_checklist_name)` - Name of the active checklist
- `$(raceready:current_checklist_index)` - 0-based index of current checklist
- `$(raceready:total_checklists)` - Total number of available checklists
- `$(raceready:actiontext_pos1)` to `$(raceready:actiontext_pos30)` - Action text by position

## Installation

1. Install the module through the Companion Module Manager
2. Add a new instance and select "RaceReady" from the list
3. Configure the connection settings (see Configuration section)

## Configuration

### Connection Settings
- **Target IP**: IP address of the RaceReady server (default: localhost)
- **Target Port**: WebSocket port of the RaceReady server (default: 3000)

### RaceReady Server Setup
Ensure your RaceReady server is running and accessible on the network. The module connects via WebSocket and supports real-time updates.

## Usage

### Basic Setup
1. Create a new Companion page for your race checklist
2. Add buttons with RaceReady actions (Toggle Action by Position, Next/Previous Checklist)
3. Configure feedbacks to show action states and checklist information
4. Use variables to display dynamic checklist content

Alternatively use the pre-configured export page from the raceready web interface.

### Example Button Configurations

#### Action Toggle Button
- **Action**: "Toggle Action by Position" (Position: 1)
- **Feedback**: "Race Ready Action State by Position" (Position: 1)
- **Style**: Green when complete, red when incomplete

#### Checklist Navigation
- **Action**: "Next Checklist" or "Previous Checklist"
- **Feedback**: "Current Checklist Name" or "Current Checklist Index"

#### Status Display
- **Feedback**: "Race Ready Overall State" to show if all actions are complete
- **Variable**: Use `$(raceready:current_checklist_name)` to display active checklist

## Advanced Features

### Position-Based Actions
Actions are referenced by their position (1-30) within the current checklist, not by their database ID. This ensures consistent button mapping regardless of checklist content changes.

### Real-Time Updates
The module receives live updates from the RaceReady server, automatically refreshing:
- Action completion states
- Checklist changes
- Navigation updates

### Multi-Device Support
Multiple Companion instances can connect to the same RaceReady server, enabling distributed control across different devices or team members.

## Troubleshooting

### Connection Issues
- Verify the RaceReady server is running and accessible
- Check IP address and port configuration
- Ensure no firewall blocking WebSocket connections (default port 3000)

### Feedback Not Updating
- Check that checklist data is loaded (may take a moment on first connection)
- Verify WebSocket connection is established
- Review Companion logs for any error messages

### Actions Not Working
- Ensure position numbers match available actions in the current checklist
- Check that RaceReady server is responding to WebSocket commands
- Verify you're referencing valid position numbers (1-based)

## Technical Details

### WebSocket Events
The module handles the following RaceReady WebSocket events:
- `all_data` - Complete action dataset
- `partial_data` - Individual action updates
- `get_checklists` - Request checklist metadata
- `checklists` - Checklist data response
- `current_checklist` - Active checklist changes

### State Management
- Maintains real-time synchronization with RaceReady server
- Handles multiple checklists with position-based action mapping
- Provides robust error handling and graceful degradation

## Version History

### v0.1.0
- Initial release with multi-checklist support
- Position-based action system
- Real-time WebSocket integration
- Comprehensive feedback and variable system

## Support

For issues related to this Companion module:
- Check the [Issues](https://github.com/Pingue/companion-module-raceready/issues) page
- Review Companion logs for diagnostic information

For RaceReady server issues:
- Visit the [RaceReady repository](https://github.com/Pingue/raceready)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Please submit pull requests or issues through the GitHub repository.
