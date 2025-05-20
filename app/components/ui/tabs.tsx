'use client';

import React, { useState } from 'react';

export function Tabs({
  value,
  onValueChange,
  className = '',
  children
}) {
  const [activeTab, setActiveTab] = useState(value);
  
  // Update active tab when value prop changes
  React.useEffect(() => {
    if (value) {
      setActiveTab(value);
    }
  }, [value]);
  
  // Update parent when tab changes
  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };
  
  // Create context for child components
  const contextValue = {
    activeTab,
    handleTabChange
  };
  
  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Context for tracking active tab
const TabsContext = React.createContext({
  activeTab: '',
  handleTabChange: (value) => {}
});

export function TabsList({ className = '', children }) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className = '', children }) {
  const { activeTab, handleTabChange } = React.useContext(TabsContext);
  const isActive = activeTab === value;
  
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none ${
        isActive 
          ? 'bg-white text-indigo-700 shadow-sm' 
          : 'hover:bg-gray-50'
      } ${className}`}
      onClick={() => handleTabChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = '', children }) {
  const { activeTab } = React.useContext(TabsContext);
  
  if (activeTab !== value) {
    return null;
  }
  
  return (
    <div className={`mt-2 ${className}`}>
      {children}
    </div>
  );
}