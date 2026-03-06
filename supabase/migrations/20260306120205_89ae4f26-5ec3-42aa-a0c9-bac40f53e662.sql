
-- Split the ALL policy into granular ones, restricting DELETE to admins only
DROP POLICY "Contacts access" ON contacts;

CREATE POLICY "Contacts select" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Contacts insert" ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Contacts update" ON contacts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Contacts delete" ON contacts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
