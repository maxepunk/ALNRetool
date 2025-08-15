"use strict";
/**
 * Raw Notion API response types
 * Only includes the property types we actually use in ALNRetool
 *
 * @module types/notion/raw
 * @description Defines TypeScript interfaces that match Notion's API responses exactly.
 * These types are used for type-safe API calls and are transformed into app types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotionTitleProperty = isNotionTitleProperty;
exports.isNotionRichTextProperty = isNotionRichTextProperty;
exports.isNotionSelectProperty = isNotionSelectProperty;
exports.isNotionMultiSelectProperty = isNotionMultiSelectProperty;
exports.isNotionStatusProperty = isNotionStatusProperty;
exports.isNotionRelationProperty = isNotionRelationProperty;
exports.isNotionRollupProperty = isNotionRollupProperty;
exports.isNotionDateProperty = isNotionDateProperty;
exports.isNotionFormulaProperty = isNotionFormulaProperty;
exports.isNotionUrlProperty = isNotionUrlProperty;
// Type guards for runtime type checking
function isNotionTitleProperty(prop) {
    return prop.type === 'title';
}
function isNotionRichTextProperty(prop) {
    return prop.type === 'rich_text';
}
function isNotionSelectProperty(prop) {
    return prop.type === 'select';
}
function isNotionMultiSelectProperty(prop) {
    return prop.type === 'multi_select';
}
function isNotionStatusProperty(prop) {
    return prop.type === 'status';
}
function isNotionRelationProperty(prop) {
    return prop.type === 'relation';
}
function isNotionRollupProperty(prop) {
    return prop.type === 'rollup';
}
function isNotionDateProperty(prop) {
    return prop.type === 'date';
}
function isNotionFormulaProperty(prop) {
    return prop.type === 'formula';
}
function isNotionUrlProperty(prop) {
    return prop.type === 'url';
}
