// 主题配置 - 放在最顶部
const ThemeConfig = {
    // 时间段设置（24小时制）
    darkThemeStart: 18,  // 18:00 开始黑夜主题
    darkThemeEnd: 6,     // 06:00 结束黑夜主题（次日）
    
    // 本地存储键名
    storageKey: 'hexo-theme-preference',
    
    // 主题模式枚举
    modes: {
        AUTO: 'auto',
        LIGHT: 'light',
        DARK: 'dark'
    }
};

// 主题管理器
class ThemeManager {
    constructor() {
        this.themeMode = ThemeConfig.modes.AUTO;
        this.isManualOverride = false;
        this.currentTheme = 'light'; // 当前应用的主题
        this.nextChangeTime = null;
        
        // DOM元素
        this.lightTheme = document.getElementById('light-theme');
        this.darkTheme = document.getElementById('dark-theme');
        this.lightHighlight = document.getElementById('light-highlight');
        this.darkHighlight = document.getElementById('dark-highlight');
        
        this.init();
    }
    
    // 初始化
    init() {
        // 从本地存储读取用户偏好
        const savedPreference = localStorage.getItem(ThemeConfig.storageKey);
        
        if (savedPreference) {
            // 有用户偏好设置
            if (savedPreference === ThemeConfig.modes.AUTO) {
                this.themeMode = ThemeConfig.modes.AUTO;
                this.isManualOverride = false;
            } else {
                this.themeMode = savedPreference;
                this.isManualOverride = true;
            }
        } else {
            // 无用户偏好，使用自动模式
            this.themeMode = ThemeConfig.modes.AUTO;
            this.isManualOverride = false;
        }
        
        this.applyTheme();
        
        // 设置定时检查（每分钟检查一次）
        setInterval(() => this.checkTimeAndApplyTheme(), 60000);
        
        // 监听系统主题变化
        this.watchSystemTheme();
        
        // 添加CSS过渡效果
        this.addTransitionStyles();
    }
    
    // 获取当前时间对应主题
    getTimeBasedTheme() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // 判断是否在黑夜主题时间段
        if (ThemeConfig.darkThemeStart <= ThemeConfig.darkThemeEnd) {
            // 正常情况：开始时间 <= 结束时间
            if (currentHour >= ThemeConfig.darkThemeStart && currentHour < ThemeConfig.darkThemeEnd) {
                return ThemeConfig.modes.DARK;
            }
        } else {
            // 跨天情况：开始时间 > 结束时间（如 22:00 到 6:00）
            if (currentHour >= ThemeConfig.darkThemeStart || currentHour < ThemeConfig.darkThemeEnd) {
                return ThemeConfig.modes.DARK;
            }
        }
        
        return ThemeConfig.modes.LIGHT;
    }
    
    // 检查时间并应用主题（仅自动模式时）
    checkTimeAndApplyTheme() {
        if (!this.isManualOverride) {
            const timeBasedTheme = this.getTimeBasedTheme();
            
            // 只有当主题变化时才应用
            if (timeBasedTheme === ThemeConfig.modes.DARK && this.darkTheme.disabled) {
                // 应该使用黑夜主题，但当前不是
                this.applyTheme();
            } else if (timeBasedTheme === ThemeConfig.modes.LIGHT && this.lightTheme.disabled) {
                // 应该使用白天主题，但当前不是
                this.applyTheme();
            }
        }
    }
    
    // 应用主题
    applyTheme() {
        let themeToApply;
        
        if (this.isManualOverride) {
            // 手动模式，使用用户选择的主题
            themeToApply = this.themeMode;
        } else {
            // 自动模式，根据时间决定
            themeToApply = this.getTimeBasedTheme();
            this.themeMode = ThemeConfig.modes.AUTO;
        }
        
        // 记录当前应用的主题
        this.currentTheme = themeToApply;
        
        // 切换CSS文件
        if (themeToApply === ThemeConfig.modes.DARK) {
            if (this.lightTheme) this.lightTheme.disabled = true;
            if (this.darkTheme) this.darkTheme.disabled = false;
            // 切换高亮主题
            if (this.lightHighlight) this.lightHighlight.disabled = true;
            if (this.darkHighlight) this.darkHighlight.disabled = false;
        } else {
            if (this.lightTheme) this.lightTheme.disabled = false;
            if (this.darkTheme) this.darkTheme.disabled = true;
            // 切换高亮主题
            if (this.lightHighlight) this.lightHighlight.disabled = false;
            if (this.darkHighlight) this.darkHighlight.disabled = true;
        }
        
        // 更新下次切换时间
        this.calculateNextChangeTime();
        
        // 添加主题类到body（便于CSS选择器）
        document.body.setAttribute('data-theme', themeToApply);
        
        // 触发自定义事件
        this.dispatchThemeChangeEvent(themeToApply);
    }
    
    // 切换主题（用户手动触发）
    toggleTheme() {
        // 切换模式：自动 -> 黑夜 -> 白天 -> 自动
        if (this.themeMode === ThemeConfig.modes.AUTO) {
            // 自动模式切换到黑夜
            this.themeMode = ThemeConfig.modes.DARK;
            this.isManualOverride = true;
        } else if (this.themeMode === ThemeConfig.modes.DARK) {
            // 黑夜模式切换到白天
            this.themeMode = ThemeConfig.modes.LIGHT;
            this.isManualOverride = true;
        } else if (this.themeMode === ThemeConfig.modes.LIGHT) {
            // 白天模式切换到自动
            this.themeMode = ThemeConfig.modes.AUTO;
            this.isManualOverride = false;
        }
        
        // 保存用户偏好
        localStorage.setItem(ThemeConfig.storageKey, this.themeMode);
        
        // 应用主题
        this.applyTheme();
    }
    
    // 设置特定主题
    setTheme(theme, savePreference = true) {
        if (Object.values(ThemeConfig.modes).includes(theme)) {
            this.themeMode = theme;
            this.isManualOverride = (theme !== ThemeConfig.modes.AUTO);
            
            if (savePreference) {
                localStorage.setItem(ThemeConfig.storageKey, theme);
            }
            
            this.applyTheme();
        }
    }
    
    // 监听系统主题偏好
    watchSystemTheme() {
        if (window.matchMedia) {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // 监听系统主题变化
            darkModeMediaQuery.addEventListener('change', (e) => {
                if (!this.isManualOverride && this.themeMode === ThemeConfig.modes.AUTO) {
                    console.log('系统主题偏好已更改，当前为:', e.matches ? 'dark' : 'light');
                }
            });
            
            // 如果没有手动设置主题，则使用系统偏好
            if (!localStorage.getItem(ThemeConfig.storageKey) && darkModeMediaQuery.matches) {
                const currentHour = new Date().getHours();
                const isNightTime = currentHour >= ThemeConfig.darkThemeStart || currentHour < ThemeConfig.darkThemeEnd;
                
                if (darkModeMediaQuery.matches && !isNightTime) {
                    // 可以在这里添加处理逻辑
                }
            }
        }
    }
    
    // 获取当前主题信息
    getThemeInfo() {
        return {
            mode: this.themeMode,
            isManual: this.isManualOverride,
            applied: this.currentTheme,
            nextChange: this.nextChangeTime,
            config: { ...ThemeConfig }
        };
    }
    
    // 计算下次主题切换时间
    calculateNextChangeTime() {
        if (this.isManualOverride) {
            this.nextChangeTime = null;
            return;
        }
        
        const now = new Date();
        const currentHour = now.getHours();
        let nextChangeHour;
        
        const timeBasedTheme = this.getTimeBasedTheme();
        if (timeBasedTheme === ThemeConfig.modes.LIGHT) {
            // 当前是白天，下次切换到黑夜
            nextChangeHour = ThemeConfig.darkThemeStart;
        } else {
            // 当前是黑夜，下次切换到白天
            nextChangeHour = ThemeConfig.darkThemeEnd;
        }
        
        const nextChange = new Date();
        nextChange.setHours(nextChangeHour, 0, 0, 0);
        
        // 如果已经过了今天的时间点，设置为明天
        if (nextChange <= now) {
            nextChange.setDate(nextChange.getDate() + 1);
        }
        
        this.nextChangeTime = nextChange;
    }
    
    // 获取主题图标
    getThemeIcon() {
        if (this.themeMode === ThemeConfig.modes.AUTO) {
            return 'fa-solid fa-circle-half-stroke';
        } else if (this.themeMode === ThemeConfig.modes.DARK) {
            return 'fa-solid fa-moon';
        } else {
            return 'fa-solid fa-sun';
        }
    }
    
    // 获取主题提示
    getThemeTooltip() {
        if (this.themeMode === ThemeConfig.modes.AUTO) {
            const nextTime = this.nextChangeTime 
                ? this.nextChangeTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                : '--:--';
            return `自动模式 (当前: ${this.currentTheme === 'dark' ? '黑夜' : '白天'}, 下次切换: ${nextTime})`;
        } else if (this.themeMode === ThemeConfig.modes.DARK) {
            return '黑夜模式 (手动)';
        } else {
            return '白天模式 (手动)';
        }
    }
    
    // 获取主题显示文本
    getThemeText() {
        if (this.themeMode === ThemeConfig.modes.AUTO) {
            return '自动';
        } else if (this.themeMode === ThemeConfig.modes.DARK) {
            return '黑夜';
        } else {
            return '白天';
        }
    }
    
    // 分发主题变化事件
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themechange', {
            detail: { 
                theme: theme, 
                mode: this.isManualOverride ? 'manual' : 'auto',
                manager: this
            }
        });
        document.dispatchEvent(event);
    }
    
    // 添加CSS过渡效果
    addTransitionStyles() {
        // 检查是否已经添加过样式
        if (document.getElementById('theme-transition-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'theme-transition-styles';
        style.textContent = `
            /* 主题切换过渡效果 */
            * {
                transition: background-color 0.3s ease, 
                           color 0.3s ease, 
                           border-color 0.3s ease,
                           box-shadow 0.3s ease !important;
            }
            
            /* 排除某些不需要过渡的元素 */
            #home-head #home-info .loop,
            #home-card #card-div .avatar img,
            .copycode i,
            .page-current .current {
                transition: none !important;
            }
            
            /* 主题切换按钮样式 */
            .theme-toggle {
                cursor: pointer;
            }
            
            /* 暗色主题下的切换按钮 */
            body[data-theme="dark"] .theme-toggle {
                color: #fff !important;
            }
            
            body[data-theme="light"] .theme-toggle {
                color: #555 !important;
            }
            
            /* 代码高亮过渡 */
            .hljs {
                transition: background-color 0.3s ease, color 0.3s ease !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// 创建全局主题管理器
const themeManager = new ThemeManager();

// Vue应用
const app = Vue.createApp({
    mixins: Object.values(mixins),
    data() {
        return {
            loading: true,
            hiddenMenu: false,
            showMenuItems: false,
            menuColor: false,
            scrollTop: 0,
            renderers: [],
            // 主题相关数据
            themeMode: 'auto',
            themeIcon: 'fa-solid fa-circle-half-stroke',
            themeTooltip: '自动模式',
            themeText: '自动'
        };
    },
    created() {
        window.addEventListener("load", () => {
            this.loading = false;
        });
    },
    mounted() {
    window.addEventListener("scroll", this.handleScroll, true);
    this.render();
    
    // 初始化主题UI
    this.updateThemeUI();
    
    // 监听主题变化事件
    document.addEventListener('themechange', (e) => {
            this.updateThemeUI();
            // 主题切换后重新高亮代码
            setTimeout(() => {
                if (window.hljs && mixins.highlight) {
                    mixins.highlight.methods.highlight.call(this);
                }
            }, 300);
        });
        
        // 确保代码高亮在页面完全加载后执行
        setTimeout(() => {
            if (window.hljs && mixins.highlight) {
                console.log('页面加载完成，执行代码高亮');
                mixins.highlight.methods.highlight.call(this);
            }
        }, 500);
        
        // 确保主题管理器在Vue挂载后可用
        window.ThemeManager = themeManager;
        window.ThemeSwitcher = {
            toggle: () => themeManager.toggleTheme(),
            set: (theme) => themeManager.setTheme(theme),
            getInfo: () => themeManager.getThemeInfo(),
            resetToAuto: () => themeManager.setTheme(ThemeConfig.modes.AUTO)
        };
    },
    methods: {
        render() {
            for (let i of this.renderers) i();
        },
        handleScroll() {
            let wrap = this.$refs.homePostsWrap;
            let newScrollTop = document.documentElement.scrollTop;
            if (this.scrollTop < newScrollTop) {
                this.hiddenMenu = true;
                this.showMenuItems = false;
            } else this.hiddenMenu = false;
            if (wrap) {
                if (newScrollTop <= window.innerHeight - 100) this.menuColor = true;
                else this.menuColor = false;
                if (newScrollTop <= 400) wrap.style.top = "-" + newScrollTop / 5 + "px";
                else wrap.style.top = "-80px";
            }
            this.scrollTop = newScrollTop;
        },
        // 主题切换方法
        toggleTheme() {
            themeManager.toggleTheme();
            this.updateThemeUI();
        },
        // 更新主题UI
        updateThemeUI() {
            this.themeMode = themeManager.themeMode;
            this.themeIcon = themeManager.getThemeIcon();
            this.themeTooltip = themeManager.getThemeTooltip();
            this.themeText = themeManager.getThemeText();
        }
    }
});

app.mount("#layout");