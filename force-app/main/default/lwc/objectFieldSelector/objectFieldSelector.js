import { LightningElement, track, api } from 'lwc';
import getObjectsAndFields from '@salesforce/apex/ObjectInfoController.getObjectsAndFields';
import getAllObjectsWithIcons from '@salesforce/apex/ObjectInfoController.getAllObjectsWithIcons';
import getReferenceTargets from '@salesforce/apex/ObjectInfoController.getReferenceTargets';

export default class ObjectFieldSelector extends LightningElement {
  // AUTOCOMPLETE OBJECTS
  @track allObjects = [];
  @track filteredObjects = [];
  @track searchKey = '';
  @track showDropdown = false;

  @api rootObjectApiName = 'Opportunity';
  @track levelFields0 = [];
  @track dynamicLevels = [];
  @track insertedFields = [];
  selectedPath = [];

  defaultObjects = ['Opportunity', 'Account', 'Contact'];

  connectedCallback() {
    this.loadAllObjects();
    this.loadRoot();
  }

  // Automatically loads object list
  async loadAllObjects() {
    try {
      const data = await getAllObjectsWithIcons();
      console.log(data);
      this.allObjects = (data || []).map(obj => ({
        label: obj.label,
        apiName: obj.apiName,
        iconUrl: obj.iconUrl
      }));
      this.filterObjects(); // Initial load (defaults if empty)
    } catch {
      this.allObjects = [];
    }
  }

  // Loads the main/root object fields
  async loadRoot() {
    if (!this.rootObjectApiName) return;
    const map = await getObjectsAndFields({ objectApiNames: [this.rootObjectApiName] });
    this.levelFields0 = this.wrapFields(map[this.rootObjectApiName] || []);
    this.dynamicLevels = [];
    this.selectedPath = [];
  }

  // When autocomplete search key changes
  handleSearchChange(e) {
    this.searchKey = e.target.value;
    this.filterObjects();
    this.showDropdown = true;
  }

  // Opens dropdown when input is focused
  handleInputFocus() {
    this.showDropdown = true;
    this.filterObjects();
  }

  // Filters object list
  filterObjects() {
    const key = (this.searchKey || '').trim().toLowerCase();
    if (!key) {
      // If input is empty, show only default objects
      this.filteredObjects = this.allObjects.filter(obj => this.defaultObjects.includes(obj.apiName));
    } else {
      this.filteredObjects = this.allObjects.filter(
        obj =>
          obj.label.toLowerCase().includes(key) ||
          obj.apiName.toLowerCase().includes(key)
      );
    }
  }

  // When an object is selected from the dropdown
  handleObjectSelect(event) {
    const apiName = event.currentTarget.dataset.apiname;
    const selected = this.allObjects.find(obj => obj.apiName === apiName);
    if (!selected) return;
    this.rootObjectApiName = selected.apiName;
    this.searchKey = selected.label;
    this.showDropdown = false;
    this.loadRoot();
  }

  // Field list, original logic continues
  wrapFields(fieldDataList) {
    const items = [];
    for (const f of fieldDataList) {
      const api = f.apiName;
      const rel = f.label;

      if (f.type === 'REFERENCE') {
        items.push({
          label: `${rel} >`,
          value: rel,
          apiName: api,
          isRelationship: true
        });
        items.push({
          label: api,
          value: api,
          apiName: api,
          isRelationship: false
        });
      } else {
        items.push({
          label: api,
          value: api,
          apiName: api,
          isRelationship: false
        });
      }
    }
    items.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    return items;
  }

  handleRootChange(e) {
    this.rootObjectApiName = e.target.value.trim();
    this.loadRoot();
  }

  async handleFieldChange(e) {
    const level = Number(e.target.dataset.level) || 0;
    const raw = e.target.value;
    const source = level === 0
      ? this.levelFields0
      : this.dynamicLevels[level - 1].fields;

    const sel = source.find(item => item.value === raw);
    if (!sel) return;

    this.selectedPath = this.selectedPath.slice(0, level);
    this.selectedPath[level] = sel.isRelationship ? sel.value : sel.apiName;

    if (!sel.isRelationship) {
      this.dynamicLevels = this.dynamicLevels.slice(0, level);
      return;
    }

    const parentObj = level === 0
      ? this.rootObjectApiName
      : this.dynamicLevels[level - 1].targetObject;

    let targets = [];
    try {
      targets = await getReferenceTargets({
        objectApiName: parentObj,
        referenceFieldName: sel.apiName
      });
    } catch {
      targets = [];
    }
    if (!targets.length) {
      this.dynamicLevels = this.dynamicLevels.slice(0, level);
      return;
    }

    const nextObj = targets[0];
    const m = await getObjectsAndFields({ objectApiNames: [nextObj] });
    const wrapped = this.wrapFields(m[nextObj] || []);

    const newLvl = {
      key: `lvl${level + 1}`,
      targetObject: nextObj,
      fields: wrapped,
      depth: level + 1,
      displayLevel: level + 2
    };
    const nl = this.dynamicLevels.slice(0, level);
    nl[level] = newLvl;
    this.dynamicLevels = nl;
  }

  insert() {
    if (this.isInsertDisabled) return;
    const token = this.selectedPath.join('.');
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    this.insertedFields = [...this.insertedFields, { id, value: token }];
    this.clearSelection();
    requestAnimationFrame(() => {
      setTimeout(() => {
        const last = this.template.querySelector(`input[data-id="${id}"]`);
        if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    });
  }

  get isInsertDisabled() {
    if (!this.selectedPath.length) return true;
    const lvl = this.selectedPath.length - 1;
    const val = this.selectedPath[lvl];

    if (lvl === 0) {
      const sel = this.levelFields0.find(f => f.value === val);
      return sel?.isRelationship;
    }
    const dyn = this.dynamicLevels[lvl - 1];
    const sel = dyn?.fields?.find(f => f.value === val);
    return sel?.isRelationship;
  }

  clearSelection() {
    this.selectedPath = [];
    this.dynamicLevels = [];
    const all = this.template.querySelectorAll('select.picker');
    all.forEach(sel => {
      sel.value = null;
      requestAnimationFrame(() => {
        setTimeout(() => sel.scrollTop = 0, 0);
      });
    });
  }

  copyField(e) {
    const inp = this.template.querySelector(`input[data-id="${e.currentTarget.dataset.id}"]`);
    if (inp) {
      inp.select();
      document.execCommand('copy');
    }
  }

  removeField(e) {
    this.insertedFields = this.insertedFields.filter(f => f.id !== e.currentTarget.dataset.id);
  }

  selectOutput(e) {
    const inp = this.template.querySelector(`input[data-id="${e.currentTarget.dataset.id}"]`);
    if (inp) inp.select();
  }

  // Close dropdown when clicking outside
  renderedCallback() {
    if (!this._listenerSet) {
      document.addEventListener('click', this.handleDocumentClick.bind(this));
      this._listenerSet = true;
    }
  }
  handleDocumentClick(e) {
    const searchDiv = this.template.querySelector('.object-lookup-container');
    if (searchDiv && !searchDiv.contains(e.target)) {
      this.showDropdown = false;
    }
  }
}
