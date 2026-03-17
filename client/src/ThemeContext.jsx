import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme-mode') || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // 监听系统主题变化的函数
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      let activeTheme = theme;
      
      // 如果是 system 模式，动态获取系统状态
      if (theme === 'system') {
        activeTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      // ⚠️ 关键：直接操作 classList 强制覆盖
      if (activeTheme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark'; // 顺便告诉浏览器滚动条也换色
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    // 只有在 system 模式下才需要监听实时变化
    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const updateTheme = (mode) => {
    setTheme(mode);
    localStorage.setItem('theme-mode', mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);