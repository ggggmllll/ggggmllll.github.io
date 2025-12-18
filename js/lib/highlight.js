mixins.highlight = {
    data() {
        return { copying: false };
    },
    created() {
        hljs.configure({ ignoreUnescapedHTML: true });
        this.renderers.push(this.highlight);
    },
    methods: {
        sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        },
        highlight() {
            let codes = document.querySelectorAll("pre");
            for (let i of codes) {
                // 问题1：提取原始代码时不能包含语言标签和复制按钮的文本
                // 解决方法：只提取代码内容区域的文本
                let codeContent = i.querySelector(".code-content");
                let code = "";
                
                if (codeContent) {
                    // 如果有行号表格，从表格中提取原始代码
                    if (codeContent.querySelector(".hljs-ln")) {
                        let codeLines = codeContent.querySelectorAll(".hljs-ln-code");
                        code = Array.from(codeLines).map(line => 
                            line.textContent
                        ).join("\n");
                    } else {
                        // 如果没有表格，直接获取文本
                        code = codeContent.textContent;
                    }
                } else {
                    // 如果没有代码内容区域，从pre中提取
                    // 但需要排除语言标签和复制按钮的文本
                    let preClone = i.cloneNode(true);
                    let langElem = preClone.querySelector(".language");
                    let copyElem = preClone.querySelector(".copycode");
                    
                    if (langElem) langElem.remove();
                    if (copyElem) copyElem.remove();
                    
                    code = preClone.textContent.trim();
                }
                
                // 问题2：获取语言时避免"plaintext"出现在代码中
                // 原来的逻辑：先从pre的类名，再从第一个子元素的类名
                let language = "plaintext";
                
                // 尝试从现有的语言标签获取
                let langElem = i.querySelector(".language");
                if (langElem) {
                    let langText = langElem.textContent.trim();
                    if (langText && langText !== "plaintext") {
                        language = langText;
                    }
                }
                
                // 如果语言标签没有有效内容，使用原来的逻辑
                if (language === "plaintext") {
                    language = [...i.classList, ...(i.firstChild?.classList || [])][0] || "plaintext";
                }
                
                // 清理语言字符串：移除"language-"前缀
                if (language.startsWith("language-")) {
                    language = language.replace("language-", "");
                }
                
                let highlighted;
                try {
                    highlighted = hljs.highlight(code, { language }).value;
                } catch {
                    // 如果高亮失败，保持原样
                    highlighted = code;
                }
                
                // 重新构建HTML
                i.innerHTML = `
                <div class="code-content hljs">${highlighted}</div>
                <div class="language">${language === "plaintext" ? "" : language}</div>
                <div class="copycode">
                    <i class="fa-solid fa-copy fa-fw"></i>
                    <i class="fa-solid fa-check fa-fw"></i>
                </div>
                `;
                
                let content = i.querySelector(".code-content");
                hljs.lineNumbersBlock(content, { singleLine: true });
                
                let copycode = i.querySelector(".copycode");
                copycode.addEventListener("click", async () => {
                    if (this.copying) return;
                    this.copying = true;
                    copycode.classList.add("copied");
                    await navigator.clipboard.writeText(code);
                    await this.sleep(1000);
                    copycode.classList.remove("copied");
                    this.copying = false;
                });
            }
        },
    },
};