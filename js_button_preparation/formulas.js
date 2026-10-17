// formulas.js — обновлено для СМП (педиатрия/подростки), 2025
// Записи разбиты по группам в formula_groups/, порядок списка сохранён.

import toxicology from './formula_groups/toxicology';
import resuscitation from './formula_groups/resuscitation';
import infusion from './formula_groups/infusion';
import respiratoryAnalgesia from './formula_groups/respiratory_analgesia';
import nmbHematology from './formula_groups/nmb_hematology';
import antibioticsAntiallergic from './formula_groups/antibiotics_antiallergic';
import emergencyMisc1 from './formula_groups/emergency_misc_1';
import emergencyMisc2 from './formula_groups/emergency_misc_2';
import adultOnly from './formula_groups/adult_only';

const formulas = [
  ...toxicology,
  ...resuscitation,
  ...infusion,
  ...respiratoryAnalgesia,
  ...nmbHematology,
  ...antibioticsAntiallergic,
  ...emergencyMisc1,
  ...emergencyMisc2,
  ...adultOnly,
];

export default formulas;
