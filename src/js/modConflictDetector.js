class ModConflictDetector {
    constructor() {
        this.conflicts = new Map();
    }

    /**
     * Analyze mod files for potential conflicts
     * @param {Array} mods Array of mod objects with path, name, and enabled properties
     * @returns {Map} Map of conflicts found
     */
    async detectConflicts(mods) {
        this.conflicts.clear();
        const fileMap = new Map(); // Maps file paths to mod names

        for (const mod of mods) {
            // Skip disabled mods
            if (!mod.enabled) continue;

            try {
                const files = await this.getModFiles(mod.path);
                
                for (const file of files) {
                    // Normalize the file path for comparison
                    const normalizedPath = file.toLowerCase();
                    
                    // Check for specific file patterns (like c00, c01, etc.)
                    if (this.isConflictSensitiveFile(normalizedPath)) {
                        if (!fileMap.has(normalizedPath)) {
                            fileMap.set(normalizedPath, [mod.name]);
                        } else {
                            fileMap.get(normalizedPath).push(mod.name);
                            
                            // If we found multiple mods with the same file, record the conflict
                            if (fileMap.get(normalizedPath).length > 1) {
                                this.conflicts.set(normalizedPath, fileMap.get(normalizedPath));
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error analyzing mod ${mod.name}:`, error);
            }
        }

        return this.conflicts;
    }

    /**
     * Check if file is sensitive to conflicts
     * @param {string} filePath 
     * @returns {boolean}
     */
    isConflictSensitiveFile(filePath) {
        // Check for common SSBU mod file patterns
        const sensitivePatterns = [
            /[/\\]c00/i,      // Fighter files
            /[/\\]c01/i,      // Fighter files
            /[/\\]c02/i,      // Fighter files
            /[/\\]c03/i,      // Fighter files
            /[/\\]c04/i,      // Fighter files
            /\.nutexb$/i,     // Texture files
            /\.bntx$/i,       // Texture files
            /\.prc$/i,        // Parameter files
            /\.eff$/i,        // Effect files
            /\.lua$/i         // Script files
        ];

        return sensitivePatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * Get all files in a mod directory
     * @param {string} modPath 
     * @returns {Promise<string[]>}
     */
    async getModFiles(modPath) {
        // Use the window.api to get mod files from the main process
        return await window.api.modOperations.getModFiles(modPath);
    }

    /**
     * Get human-readable conflict description
     * @param {Map} conflicts 
     * @returns {Array} Array of conflict descriptions
     */
    getConflictDescriptions() {
        const descriptions = [];
        
        this.conflicts.forEach((mods, file) => {
            const fileName = file.split(/[/\\]/).pop(); // Get just the filename
            descriptions.push({
                file: fileName,
                mods: mods,
                description: `File "${fileName}" is present in multiple mods: ${mods.join(', ')}`
            });
        });

        return descriptions;
    }
}

export default ModConflictDetector;
