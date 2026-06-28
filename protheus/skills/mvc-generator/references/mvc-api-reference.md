# MVC API Reference

Detailed reference for FWFormStruct customization, View layout options, and MenuDef action codes.

---

## Table of Contents

- [FWFormStruct Parameters](#fwformstruct-parameters)
- [Customizing Structures](#customizing-structures)
- [View Layout Options](#view-layout-options)
- [MenuDef Action Codes](#menudef-action-codes)
- [Custom Menu Actions](#custom-menu-actions)

---

## FWFormStruct Parameters

`FWFormStruct()` loads field definitions from the SX3 data dictionary:

| Parameter                | Value | Purpose                                                    |
| ------------------------ | ----- | ---------------------------------------------------------- |
| `FWFormStruct(1, "XXX")` | 1     | Model structure (field rules, validations, initial values) |
| `FWFormStruct(2, "XXX")` | 2     | View structure (visual properties, labels, order)          |

---

## Customizing Structures

```tlpp
// Remove a field from the structure
oStruct:RemoveField("ZZ1_SYSFIELD")

// Set field as read-only (WHEN = .F.)
oStruct:SetProperty("ZZ1_STATUS", MODEL_FIELD_WHEN, ;
  FWBuildFeature(STRUCT_FEATURE_WHEN, ".F."))

// Set initial value
oStruct:SetProperty("ZZ1_STATUS", MODEL_FIELD_INIT, ;
  FWBuildFeature(STRUCT_FEATURE_INIPAD, "'1'"))

// Set field validation
oStruct:SetProperty("ZZ1_VALUE", MODEL_FIELD_VALID, ;
  FWBuildFeature(STRUCT_FEATURE_VALID, "ValidateValue()"))

// Set field trigger (execute when field changes)
// Triggers are typically defined in SX7 but can be added programmatically
```

---

## View Layout Options

### Horizontal Box (split screen vertically)

```tlpp
// 40% top, 60% bottom
oView:CreateHorizontalBox("BOX_TOP", 40)
oView:CreateHorizontalBox("BOX_BOTTOM", 60)
```

### Vertical Box (split screen horizontally)

```tlpp
// 50% left, 50% right
oView:CreateVerticalBox("BOX_LEFT", 50)
oView:CreateVerticalBox("BOX_RIGHT", 50)
```

### Folder (tabs)

```tlpp
oView:CreateFolder("TABS", "BOX_MASTER")
oView:AddSheet("TABS", "General",   "TAB_GENERAL")
oView:AddSheet("TABS", "Financial", "TAB_FINANCIAL")
oView:CreateHorizontalBox("BOX_GEN", 100, /*cOwner*/, /*lProp*/, "TAB_GENERAL")
oView:CreateHorizontalBox("BOX_FIN", 100, /*cOwner*/, /*lProp*/, "TAB_FINANCIAL")
```

---

## MenuDef Action Codes

| Code | Action  | Description                     |
| ---- | ------- | ------------------------------- |
| 1    | Include | Add a new record                |
| 2    | Edit    | Modify existing record          |
| 3    | Delete  | Remove a record                 |
| 4    | View    | View record (read-only)         |
| 5    | Copy    | Copy record as template for new |

---

## Custom Menu Actions

```tlpp
// Add a custom action button
aAdd(aMenu, {"Print Report", "MYMOD01_PRINT", 0, 6, 0, Nil})

// Custom action function
User Function MYMOD01_PRINT()
  // Custom printing logic
  MsgInfo("Report generated", "Print")
Return
```
