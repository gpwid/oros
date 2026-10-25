# Milestone 5 Adversarial Challenger Report: Obsidian Bridge

## 1. Observation
- Target module under test: `src/renderer/utils/obsidianBridge.ts`
- Adversarial test suite created: `tests/e2e/obsidian_adversarial.test.ts` (24 adversarial stress tests across 5 focus areas).
- Executed commands and verbatim test results:
  - Command: `pnpm.cmd test tests/e2e/obsidian_adversarial.test.ts`
  - Output:
    ```
    Test Files  1 failed (1)
         Tests  12 failed | 12 passed (24)
      Duration  556ms
    ```
  - Command: `pnpm.cmd test`
  - Output:
    ```
    Test Files  1 failed | 16 passed (17)
         Tests  12 failed | 370 passed (382)
    ```

### Specific Verbatim Test Failures & Line Numbers in `src/renderer/utils/obsidianBridge.ts`:

1. **`ADV.1.3: handles whitespace-only strings without producing empty filename`**
   - File: `src/renderer/utils/obsidianBridge.ts:8-14`
   - Observation: Calling `sanitizeFilename('   \t\n  ')` returns `""` (length 0).
   - Verbatim failure:
     ```
     AssertionError: expected 0 to be greater than 0
      ❯ tests/e2e/obsidian_adversarial.test.ts:46:29
     ```
   - Export impact: In `exportWorldToObsidianFiles`, `const cleanFilename = sanitizeFilename(entity.title)` evaluates to `""`, resulting in `filePath = "${folderDir}/.md"`, creating an unnamed hidden dotfile.

2. **`ADV.1.4: tests trailing dots and spaces in filenames (Windows forbidden)`**
   - File: `src/renderer/utils/obsidianBridge.ts:8-14`
   - Observation: `sanitizeFilename('My Document.')` returns `'My Document.'`.
   - Verbatim failure:
     ```
     AssertionError: expected true to be false
     - false
     + true
      ❯ tests/e2e/obsidian_adversarial.test.ts:53:39
     ```
   - Windows impact: On Windows NTFS/Win32 APIs, filenames ending in a dot `.` or space ` ` are prohibited and fail during filesystem file creation.

3. **`ADV.1.5: tests Windows reserved device names (CON, PRN, AUX, NUL, COM1, LPT1)`**
   - File: `src/renderer/utils/obsidianBridge.ts:8-14`
   - Observation: `sanitizeFilename('CON')` returns `'CON'`.
   - Verbatim failure:
     ```
     AssertionError: expected 'CON' not to be 'CON'
      ❯ tests/e2e/obsidian_adversarial.test.ts:68:45
     ```
   - Windows impact: In Windows, reserved device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`) cannot be created as files with any extension (e.g. `CON.md` crashes or writes to console device).

4. **`ADV.2.2: circular parent folder references must not cause RangeError / stack overflow`**
   - File: `src/renderer/utils/obsidianBridge.ts:284-292`
   - Observation: In `exportWorldToObsidianFiles`, `getFolderPath` recursively resolves `parentId` without cycle tracking or memoization of active nodes.
   - Verbatim failure:
     ```
     AssertionError: expected [Function] to not throw an error but 'RangeError: Maximum call stack size e…' was thrown
     - Expected: undefined
     + Received: "RangeError: Maximum call stack size exceeded"
      ❯ tests/e2e/obsidian_adversarial.test.ts:133:14
     ```
   - Impact: Critical unhandled crash of vault export when circular folder hierarchies exist.

5. **`ADV.2.3: self-referencing folder (parentId == id) must not cause stack overflow`**
   - File: `src/renderer/utils/obsidianBridge.ts:284-292`
   - Observation: `getFolderPath` with `folder.parentId === folder.id` causes immediate infinite recursion.
   - Verbatim failure:
     ```
     AssertionError: expected [Function] to not throw an error but 'RangeError: Maximum call stack size e…' was thrown
     - Expected: undefined
     + Received: "RangeError: Maximum call stack size exceeded"
      ❯ tests/e2e/obsidian_adversarial.test.ts:148:14
     ```

6. **`ADV.3.1: parses tags and aliases containing quotes without losing them`**
   - File: `src/renderer/utils/obsidianBridge.ts:164`
   - Code: `const listMatch = line.match(/^\s+-\s*"?([^"]*)"?$/)`
   - Observation: `parseFrontmatter` parses `tags: ['warrior', 'order of "the dawn"', 'hero']` into `['warrior', 'hero']`. The tag `order of "the dawn"` is completely dropped.
   - Verbatim failure:
     ```
     AssertionError: expected [ 'warrior', 'hero' ] to include 'order of "the dawn"'
      ❯ tests/e2e/obsidian_adversarial.test.ts:167:32
     ```
   - Impact: Silent data loss of tags and aliases containing quotes.

7. **`ADV.3.2: unescapes quotes in title and summary during parseFrontmatter`**
   - File: `src/renderer/utils/obsidianBridge.ts:154`
   - Code: `let parsedVal: any = val.replace(/^["']|["']$/g, '')`
   - Observation: `serializeFrontmatter` escapes quotes as `\"`. `parseFrontmatter` strips outer quotes but fails to unescape internal `\"`, resulting in `Lord \"Raven\" of Ostergard`.
   - Verbatim failure:
     ```
     AssertionError: expected 'Lord \"Raven\" of Ostergard' to be 'Lord "Raven" of Ostergard'
     Expected: "Lord "Raven" of Ostergard"
     Received: "Lord \"Raven\" of Ostergard"
      ❯ tests/e2e/obsidian_adversarial.test.ts:180:33
     ```

8. **`ADV.3.3: preserves string types for numeric-like titles and IDs`**
   - File: `src/renderer/utils/obsidianBridge.ts:157-158`
   - Code: `if (!isNaN(Number(parsedVal)) && parsedVal !== '') parsedVal = Number(parsedVal)`
   - Observation: Numeric strings `"1984"` or `"007"` are coerced into `1984` and `7` (type `number`).
   - Verbatim failure:
     ```
     AssertionError: expected 'number' to be 'string'
     Expected: "string"
     Received: "number"
      ❯ tests/e2e/obsidian_adversarial.test.ts:193:37
     ```
   - Impact: Type corruption of `LoreEntity.id` and `LoreEntity.title` violating TypeScript contracts.

9. **`ADV.3.4: handles infobox field values containing "value:" or colons without truncation`**
   - File: `src/renderer/utils/obsidianBridge.ts:202`
   - Code: `currentField.value = line.split('value:')[1]?.trim().replace(/^["']|["']$/g, '')`
   - Observation: For `value: "Estimated value: 500 gold coins"`, `split('value:')[1]` splits on `'value:'` and takes only the second element (`' "Estimated '`), discarding everything after it.
   - Verbatim failure:
     ```
     AssertionError: expected 'Estimated' to be 'Estimated value: 500 gold coins'
     Expected: "Estimated value: 500 gold coins"
     Received: "Estimated"
      ❯ tests/e2e/obsidian_adversarial.test.ts:223:29
     ```
   - Impact: Severe silent data corruption and truncation of infobox content.

10. **`ADV.4.3: does NOT transform wiki-links inside inline code or code blocks`**
    - File: `src/renderer/utils/obsidianBridge.ts:254-259`
    - Code: Global regex replacement across entire markdown string.
    - Observation: `obsidianMarkdownToHtmlContent("Code: `[[Horn-Keep]]`")` produces `<p>Code: `<span data-type="mention"...>@Horn-Keep</span>`</p>`.
    - Verbatim failure:
      ```
      AssertionError: expected '<p>Code example: `<span data-type="me…' to contain '`[[Horn-Keep]]`'
      Expected: "`[[Horn-Keep]]`"
      Received: "<p>Code example: `<span data-type="mention" data-id="e-horn" data-label="Horn-Keep">@Horn-Keep</span>` and regular link <span data-type="mention" data-id="e-horn" data-label="Horn-Keep">@Horn-Keep</span>.</p>"
       ❯ tests/e2e/obsidian_adversarial.test.ts:307:20
      ```

11. **`ADV.5.2: Invariant: entity with quotes in title roundtrips losslessly`**
    - File: `src/renderer/utils/obsidianBridge.ts:154, 410`
    - Observation: `original.title = 'Vaelen "The Boreal Warden"'` reconstitutes as `'Vaelen \"The Boreal Warden\"'`.
    - Verbatim failure:
      ```
      AssertionError: expected 'Vaelen \"The Boreal Warden\"' to be 'Vaelen "The Boreal Warden"'
       ❯ tests/e2e/obsidian_adversarial.test.ts:356:35
      ```

12. **`ADV.5.3: Invariant: entity with complex infobox colons and quotes roundtrips losslessly`**
    - File: `src/renderer/utils/obsidianBridge.ts:199-207`
    - Observation: Infobox fields with quotes retain backslashes (`Sun-Sword: \"Dawnbringer\"`) and values containing `value:` truncate to `Estimated`.
    - Verbatim failure:
      ```
      AssertionError: expected 'Sun-Sword: \"Dawnbringer\"' to be 'Sun-Sword: "Dawnbringer"'
       ❯ tests/e2e/obsidian_adversarial.test.ts:383:25
      ```

---

## 2. Logic Chain
1. **From Observation 4 & 5 to Critical Export Crash**:
   In `src/renderer/utils/obsidianBridge.ts`, `getFolderPath(folderId)` does not maintain an active traversal set. When encountering circular references (`fA.parentId = fB` and `fB.parentId = fA`) or self-references (`fA.parentId = fA`), the recursive function enters an infinite call loop without termination, triggering a fatal Node.js / JavaScript engine `RangeError: Maximum call stack size exceeded`. This terminates execution and prevents vault export.

2. **From Observation 6 to Data Loss in Frontmatter**:
   In `parseFrontmatter`, line 164 matches list elements with `const listMatch = line.match(/^\s+-\s*"?([^"]*)"?$/)`. The negated character group `[^"]*` terminates at the first encountered quotation mark. When an element contains quotes (such as `  - "order of \"the dawn\""`), the match fails and the line is discarded. This directly leads to missing tags and aliases upon import.

3. **From Observation 7, 11, 12 to Lossless Roundtrip Invariant Failure**:
   `serializeFrontmatter` writes escaped quotes (`\"`). However, `parseFrontmatter` only replaces delimiter quotes (`/^["']|["']$/g`) and never restores `\"` to `"`. Reconstituted entities accumulate escape slashes, violating the fundamental identity invariant $import(export(E)) == E$.

4. **From Observation 9 & 12 to Silent Data Truncation**:
   In `parseFrontmatter` (line 202), `line.split('value:')[1]` splits on the literal string `value:`. If the field value contains `value:` (e.g. `value: "Estimated value: 500 gold coins"`), the string is split into three parts, and index 1 (`"Estimated `) is retained while index 2 (` 500 gold coins"`) is discarded.

5. **From Observation 1, 2, 3 to Windows Filesystem Incompatibility**:
   `sanitizeFilename` only replaces `[<>:"/\\|?*]`. It leaves trailing dots (`"File."`), returns empty strings for whitespace (`"   "`), and does not guard against Windows DOS reserved device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`). On Windows platforms, attempting to write files with these names results in OS error codes (`EPERM`/`EINVAL`) or stream hijacking.

6. **From Observation 10 to Syntax Corruption**:
   `obsidianMarkdownToHtmlContent` does not protect code blocks or inline backticks before replacing `[[...]]` with mention spans. Consequently, documentation containing code examples of wiki-links is erroneously rewritten.

---

## 3. Caveats
- No caveats regarding reproducibility: all 12 failures are 100% deterministically reproducible via `pnpm.cmd test tests/e2e/obsidian_adversarial.test.ts`.
- The adversarial test suite was co-located in `tests/e2e/` following project layout conventions, leaving `.agents/teamwork/` restricted to metadata only.

---

## 4. Conclusion
**Verdict: REQUEST_CHANGES**

The Milestone 5 implementation in `src/renderer/utils/obsidianBridge.ts` fails critical edge-case, security, and invariant requirements:
1. **Critical Crash**: Infinite recursion / stack overflow on circular folder references.
2. **Silent Data Loss**: Omission of quoted tags and aliases during YAML parsing.
3. **Data Truncation**: Truncation of infobox values containing the substring `"value:"`.
4. **Invariant Violation**: Accumulation of raw backslashes `\"` breaking lossless roundtrip.
5. **Schema Violation**: Coercion of numeric string IDs and titles to numbers.
6. **Windows OS Incompatibility**: Failure to sanitize Windows reserved names, trailing dots, and whitespace-only titles.
7. **Markdown Corruption**: Unprotected replacement of wiki-links inside code blocks.

### Concrete Fixes Required in `src/renderer/utils/obsidianBridge.ts`:
1. **`sanitizeFilename`**:
   - Strip trailing dots and spaces: `.replace(/[\s.]+$/, '')`
   - Fall back to `'Untitled'` if sanitized string is empty: `return sanitized || 'Untitled'`
   - Sanitize Windows reserved device names: if `/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name)`, append `_` or prefix `_`.
2. **`getFolderPath`**:
   - Add cycle detection using a `visited = new Set<string>()`. If `visited.has(folderId)` or `folder.parentId === folderId`, break cycle and return `sanitizeFilename(folder.name)`.
3. **`parseFrontmatter`**:
   - For string values: unescape `\"` via `.replace(/\\"/g, '"')`.
   - Do not convert `id` or `title` to `number`: keep them as strings.
   - For list items: parse `line.match(/^\s+-\s*(.*)$/)`, trim outer quotes, and unescape `\"`.
   - For infobox fields: extract value via `line.match(/^\s*value:\s*(.*)$/)` or `line.slice(line.indexOf('value:') + 6).trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')` instead of `line.split('value:')[1]`. Apply the same slice/regex to `subtitle:` and `label:`.
4. **`obsidianMarkdownToHtmlContent`**:
   - Protect code spans (`` `...` `` and ```` ```...``` ````) by replacing them with unique placeholders before running wiki-link regex, then restore the placeholders.

---

## 5. Verification Method
To independently verify the failures:
```powershell
pnpm.cmd test tests/e2e/obsidian_adversarial.test.ts
```
Expected output: 12 tests fail, documenting all 12 specific vulnerabilities.

To verify resolution once the worker applies the fixes:
```powershell
pnpm.cmd test tests/e2e/obsidian_adversarial.test.ts
pnpm.cmd test
pnpm.cmd exec tsc --noEmit
```
All 24 adversarial tests and all 382 project tests must pass with 0 errors.
