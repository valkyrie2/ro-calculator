import { ActiveSkillModel } from '../../jobs/_character-base.abstract';

export const FourColorFireFn = (): ActiveSkillModel => ({
  label: 'Fire Colors Charm',
  name: 'Fire Colors Charm',
  inputType: 'selectButton',
  dropdown: [
    { label: 'Yes', value: 1, isUse: true, bonus: { 'flat_Red Flame Cannon': 8500 } },
    { label: 'No', value: 0, isUse: false },
  ],
});
