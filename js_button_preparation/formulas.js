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
import analgesicsSteroids from './formula_groups/analgesics_steroids';
import cardioEndocrineMisc from './formula_groups/cardio_endocrine_misc';
import thrombolyticsAntiplatelets from './formula_groups/thrombolytics_antiplatelets';
import antiarrhythmicsVasopressors from './formula_groups/antiarrhythmics_vasopressors';
import bronchodilatorsRsi from './formula_groups/bronchodilators_rsi';
import electrolytesSolutions from './formula_groups/electrolytes_solutions';
import antidotesLocalAnalgesia from './formula_groups/antidotes_local_analgesia';

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
  ...analgesicsSteroids,
  ...cardioEndocrineMisc,
  ...thrombolyticsAntiplatelets,
  ...antiarrhythmicsVasopressors,
  ...bronchodilatorsRsi,
  ...electrolytesSolutions,
  ...antidotesLocalAnalgesia,
];

export default formulas;
