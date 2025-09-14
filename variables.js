module.exports = function (self) {
	const variables = []
	
	// Checklist-related variables
	variables.push({ variableId: 'current_checklist_name', name: 'Name of the current checklist' })
	variables.push({ variableId: 'current_checklist_index', name: 'Index of the current checklist (0-based)' })
	variables.push({ variableId: 'total_checklists', name: 'Total number of checklists' })
	
	self.setVariableDefinitions(variables)
}
