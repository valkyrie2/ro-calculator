-- =========================================================================
-- RO Calculator — admin custom items: optional enchant template pointer
--
-- Stores the aegisName of an existing item whose enchant pools should be
-- copied for this custom item. The frontend reads this field and calls
-- `registerEnchants(item.aegisName, getEnchants(enchant_template))` so
-- the new item shows the same 4 enchant slots as the template.
-- =========================================================================

alter table public.custom_items
  add column if not exists enchant_template text;
