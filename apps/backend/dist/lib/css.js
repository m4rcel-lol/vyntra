import safeParser from "postcss-safe-parser";
const blockedValue = /(url\s*\(|expression\s*\(|javascript:|data:|vbscript:|@import|behavior\s*:|-moz-binding)/i;
const blockedProperty = /^(behavior|-moz-binding)$/i;
const allowedSelector = /^(:root|body|main|\.vyntra-profile|\.profile-card|\.profile-avatar|\.profile-banner|\.profile-links|\.profile-link|\.profile-badge|\.profile-title|\.profile-bio|\.profile-music|\.profile-embed)([\s.:#>[~+*\-\w()[\]="']*)?$/;
function scopeSelector(selector) {
    const trimmed = selector.trim();
    if (!allowedSelector.test(trimmed))
        return null;
    if (trimmed.startsWith(".vyntra-profile"))
        return trimmed;
    if (trimmed === ":root" || trimmed === "body" || trimmed === "main")
        return ".vyntra-profile";
    return `.vyntra-profile ${trimmed}`;
}
export function sanitizeCustomCss(input) {
    const source = input.trim().slice(0, 6000);
    if (source.length === 0)
        return "";
    if (blockedValue.test(source))
        return "";
    const root = safeParser(source);
    root.walkAtRules((rule) => {
        if (rule.name.toLowerCase() !== "keyframes") {
            rule.remove();
        }
    });
    root.walkRules((rule) => {
        const selectors = rule.selectors
            .map(scopeSelector)
            .filter((selector) => selector !== null);
        if (selectors.length === 0) {
            rule.remove();
            return;
        }
        rule.selectors = selectors;
    });
    root.walkDecls((decl) => {
        if (blockedProperty.test(decl.prop) || blockedValue.test(decl.value)) {
            decl.remove();
        }
    });
    return root.toString().slice(0, 6000);
}
//# sourceMappingURL=css.js.map