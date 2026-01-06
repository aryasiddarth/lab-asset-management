const ACTIVITY_STORAGE_KEY = 'recentActivities';
const MAX_ACTIVITIES = 7;

// Page name mappings
const PAGE_NAMES = {
  '/': 'Dashboard',
  '/labs': 'Labs',
  '/assets': 'Assets/Stocks',
  '/import-export': 'Import/Export',
};

// Get page name from path
function getPageName(pathname) {
  // Check for specific lab or asset detail pages
  if (pathname.startsWith('/labs/')) {
    return 'Lab Details';
  }
  if (pathname.startsWith('/assets/')) {
    return 'Asset Details';
  }
  
  return PAGE_NAMES[pathname] || pathname;
}

// Get all activities
export function getActivities() {
  try {
    const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading activities:', error);
    return [];
  }
}

// Add a new activity
export function addActivity(pathname) {
  try {
    const activities = getActivities();
    const pageName = getPageName(pathname);
    const timestamp = new Date().toISOString();
    
    const newActivity = {
      id: Date.now(),
      page: pageName,
      path: pathname,
      timestamp,
      date: new Date(timestamp).toLocaleDateString(),
      time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add to beginning and keep only last MAX_ACTIVITIES
    const updated = [newActivity, ...activities].slice(0, MAX_ACTIVITIES);
    
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error adding activity:', error);
    return getActivities();
  }
}

// Clear all activities
export function clearActivities() {
  try {
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing activities:', error);
  }
}

