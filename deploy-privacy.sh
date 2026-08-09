#!/bin/bash

# 部署隐私政策到 GitHub Pages
# 使用方法：./deploy-privacy.sh

REPO_NAME="IELTSvocab"
GITHUB_USER="mikelu"
PRIVACY_FILE="PRIVACY.md"

echo " 部署隐私政策到 GitHub Pages..."

# 检查隐私政策文件是否存在
if [ ! -f "$PRIVACY_FILE" ]; then
    echo "❌ 错误：找不到 $PRIVACY_FILE"
    exit 1
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "📁 创建临时目录：$TEMP_DIR"

# 复制隐私政策文件
cp "$PRIVACY_FILE" "$TEMP_DIR/index.md"

# 创建基本的 HTML 包装器
cat > "$TEMP_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>隐私政策 - IELTS Vocabulary App</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #1a1a1a;
            border-bottom: 2px solid #6C63FF;
            padding-bottom: 10px;
        }
        h2 {
            color: #2a2a2a;
            margin-top: 30px;
        }
        .container {
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            border: none;
            color: #6C63FF;
        }
        .update-date {
            color: #666;
            font-size: 14px;
        }
        a {
            color: #6C63FF;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IELTS Vocabulary App</h1>
            <p class="update-date">最后更新：2025 年 8 月 9 日</p>
        </div>
        <div id="content"></div>
    </div>
    <script>
        // 简单的 Markdown 渲染
        fetch('index.md')
            .then(response => response.text())
            .then(text => {
                // 简单的 Markdown 转换
                let html = text
                    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/^- (.+)$/gm, '<li>$1</li>')
                    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>');
                
                document.getElementById('content').innerHTML = '<p>' + html + '</p>';
            })
            .catch(err => {
                document.getElementById('content').innerHTML = '<p>无法加载隐私政策内容。</p>';
            });
    </script>
</body>
</html>
EOF

echo "✅ 已创建 index.html"

# 显示部署说明
echo ""
echo " 部署步骤："
echo ""
echo "1. 将以下文件上传到你的 GitHub 仓库："
echo "   - index.html"
echo "   - index.md"
echo ""
echo "2. 启用 GitHub Pages："
echo "   - 打开仓库 → Settings → Pages"
echo "   - Source 选择 'main' 分支"
echo "   - 保存"
echo ""
echo "3. 访问你的隐私政策页面："
echo "   https://$GITHUB_USER.github.io/$REPO_NAME/"
echo ""
echo "4. 更新 app.config.ts 中的隐私政策 URL"
echo ""

# 清理临时目录
echo "📦 临时文件位置：$TEMP_DIR"
echo "   请手动上传到 GitHub 仓库"
