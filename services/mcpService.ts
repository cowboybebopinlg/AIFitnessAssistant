import type { AppData, DailyLog, UserProfile } from '../types';

const getRecentLogs = (logs: { [date: string]: DailyLog }, count = 3): DailyLog[] => {
    const sortedDates = Object.keys(logs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const recentLogs: DailyLog[] = [];
    for (let i = 0; i < count && i < sortedDates.length; i++) {
        recentLogs.push(logs[sortedDates[i]]);
    }
    return recentLogs;
};

export const generateMCP = (appData: AppData): string => {
    const { userProfile, targets, logs } = appData;

    const recentLogs = getRecentLogs(logs);

    // Sanitize logs to remove large data blobs that are not useful for the model
    const sanitizedLogs = recentLogs.map(log => {
        const sanitizedLog = { ...log };
        // Example of removing a large, less useful field:
        // delete sanitizedLog.someLargeField; 
        return sanitizedLog;
    });

    const mcp = `
## Model Context Protocol (MCP)

This protocol provides a summary of the user's data, goals, and recent history to give you deep, persistent context for every interaction. Use this information to provide highly personalized and aligned responses.

### User Profile
${userProfile ? JSON.stringify(userProfile, null, 2) : "No profile set."}

### Nutrition Targets
${JSON.stringify(targets, null, 2)}

### Recent History (Last ${sanitizedLogs.length} Days)
${sanitizedLogs.length > 0 ? JSON.stringify(sanitizedLogs, null, 2) : "No recent history available."}
`;

    return mcp;
};
