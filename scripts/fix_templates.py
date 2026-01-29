import re

# Read the file
with open(r'c:/Users/miche/Downloads/examepad-saas-prova-digital/components/StudentPortal/StudentDashboardView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix malformed class names with spaces around hyphens (more comprehensive)
replacements = {
    'items - center': 'items-center',
    'items - baseline': 'items-baseline',
    'text - xs': 'text-xs',
    'text - sm': 'text-sm',
    'text - lg': 'text-lg',
    'text - 2xl': 'text-2xl',
    'text - \\[10px\\]': 'text-[10px]',
    'font - bold': 'font-bold',
    'h - full': 'h-full',
    'h - 8': 'h-8',
    'h - 10': 'h-10',
    'h - 1\\.5': 'h-1.5',
    'h - 20': 'h-20',
    'w - 8': 'w-8',
    'w - 2': 'w-2',
    'w - 1\\.5': 'w-1.5',
    'w - 20': 'w-20',
    'p - 3': 'p-3',
    'p - 4': 'p-4',
    'p - 5': 'p-5',
    'px - 2': 'px-2',
    'px - 4': 'px-4',
    'py - 0\\.5': 'py-0.5',
    'py - 1': 'py-1',
    'rounded - xl': 'rounded-xl',
    'rounded - lg': 'rounded-lg',
    'rounded - full': 'rounded-full',
    'shadow - sm': 'shadow-sm',
    'shadow - inner': 'shadow-inner',
    'border - l - 4': 'border-l-4',
    'border - 4': 'border-4',
    'flex - col': 'flex-col',
    'gap - 3': 'gap-3',
    'gap - 4': 'gap-4',
    'justify - center': 'justify-center',
    'mx - auto': 'mx-auto',
    'mb - 4': 'mb-4',
    'line - through': 'line-through',
}

for old, new in replacements.items():
    content = re.sub(old, new, content)

# Replace template literals with string concatenation - simpler approach
# Find all className={`...`} patterns
def fix_classname(match):
    template = match.group(1)
    # Check if it has interpolation
    if '${' in template:
        # Split by ${ and }
        parts = []
        current = template
        while '${' in current:
            before, rest = current.split('${', 1)
            expr, after = rest.split('}', 1)
            if before:
                parts.append(f"'{before}'")
            parts.append(f"({expr.strip()})")
            current = after
        if current:
            parts.append(f"'{current}'")
        return 'className={' + ' + '.join(parts) + '}'
    return match.group(0)

content = re.sub(r'className=\{`([^`]*)`\}', fix_classname, content)

# Fix style width patterns
content = re.sub(
    r'style=\{\{\s*width:\s*`\$\{\s*([^}]+)\s*\}%\s*`\s*\}\}',
    r"style={{ width: (\1) + '%' }}",
    content
)

# Fix key patterns
content = re.sub(r'key=\{`empty - \$\{\s*(\w+)\s*\}\s*`\}', r"key={'empty-' + \1}", content)

# Write back
with open(r'c:/Users/miche/Downloads/examepad-saas-prova-digital/components/StudentPortal/StudentDashboardView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all template literals and malformed class names!")
