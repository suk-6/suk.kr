ALTER TABLE projects
ADD COLUMN case_study TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(case_study));
