
-- Drop existing FK constraints and re-add with ON DELETE CASCADE

ALTER TABLE leads DROP CONSTRAINT leads_contact_id_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE deals DROP CONSTRAINT deals_contact_id_fkey;
ALTER TABLE deals ADD CONSTRAINT deals_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE contracts DROP CONSTRAINT contracts_contact_id_fkey;
ALTER TABLE contracts ADD CONSTRAINT contracts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE units DROP CONSTRAINT units_contact_id_fkey;
ALTER TABLE units ADD CONSTRAINT units_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE contact_comments DROP CONSTRAINT contact_comments_contact_id_fkey;
ALTER TABLE contact_comments ADD CONSTRAINT contact_comments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
