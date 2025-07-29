# Salesforce Object Field Selector


A dynamic and customizable Lightning Web Component (LWC) for selecting Salesforce objects and fields, including support for multi-level reference fields. Perfect for use in merge field generators, formula builders, and dynamic UI integrations.

---

## ✨ Features

* 🔍 Dynamic object and field discovery via Apex
* 🔁 Supports reference traversal (`Account.Owner.Name`, etc.)
* 📦 Works as standalone component or embedded modal
* 💅 Clean iOS-style UI with multi-level pickers
* 🧠 Fully dynamic — no hardcoded schema
* 📤 Easily inserted into templates, editors, or formulas

---

## 🚀 Use Cases

* Merge field generator tools
* Formula field editor assistants
* Dynamic field insert modals for rich text editors
* Any Salesforce LWC needing structured field selection

---

## 📸 Screenshots

<img width="1269" height="707" alt="Object Field Selector UI" src="https://github.com/user-attachments/assets/446104fa-4aea-42b9-b5cf-1136659c3344" />

*Multi-level reference selection with object-aware UI*

---

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kayacafersadik/salesforce-object-field-selector.git
```

### 2. Deploy to Salesforce Org (SFDX)

```bash
sfdx force:source:deploy -p force-app
```

---

## 🧱 Component Usage

```html
<c-object-field-selector
    root-object-api-name= {objectApiName}>
</c-object-field-selector>
```

| Property               | Type     | Description                                                     |
| ---------------------- | -------- | --------------------------------------------------------------- |
| `root-object-api-name` | `String` | API name of the root object (e.g., `Opportunity`, `Contact`)    |

---

## 🕘 Version History

### v0.1.0-beta

* Initial beta release
* Object and field picker UI implemented
* Multi-level reference traversal support
* iOS-style interface with keyboard accessibility

---

## 📄 License

MIT License

---

## ✉️ Contact

For issues, suggestions, or contributions, feel free to open an [issue](https://github.com/kayacafersadik/salesforce-object-field-selector/issues) or reach out directly.
