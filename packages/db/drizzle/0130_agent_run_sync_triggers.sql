-- Migration 0130: Real-time sync triggers for agent runs and project updates

CREATE OR REPLACE FUNCTION rev_agent_run() RETURNS trigger AS $$
DECLARE
  r agent_run%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  PERFORM bump_rev('agents:' || r.project_id, r.project_id);
  PERFORM bump_rev('board:' || r.project_id, r.project_id);
  PERFORM bump_rev('project:' || r.project_id, r.project_id);
  IF r.issue_id IS NOT NULL THEN
    PERFORM bump_rev('issue:' || r.issue_id, r.project_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_run_rev ON agent_run;
CREATE TRIGGER agent_run_rev AFTER INSERT OR UPDATE OR DELETE ON agent_run
  FOR EACH ROW EXECUTE FUNCTION rev_agent_run();

CREATE OR REPLACE FUNCTION rev_project() RETURNS trigger AS $$
DECLARE
  r project%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  PERFORM bump_rev('project:' || r.id, r.id);
  PERFORM bump_rev('board:' || r.id, r.id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_rev ON project;
CREATE TRIGGER project_rev AFTER INSERT OR UPDATE ON project
  FOR EACH ROW EXECUTE FUNCTION rev_project();

CREATE OR REPLACE FUNCTION rev_issue() RETURNS trigger AS $$
DECLARE
  r issue%ROWTYPE;
  lo integer;
  hi integer;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  PERFORM bump_rev('board:' || r.project_id, r.project_id);
  PERFORM bump_rev('project:' || r.project_id, r.project_id);
  IF TG_OP = 'DELETE' THEN
    DELETE FROM revision WHERE scope = 'issue:' || r.id;
  ELSE
    PERFORM bump_rev('issue:' || r.id, r.project_id);
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.initiative_id IS DISTINCT FROM NEW.initiative_id THEN
    lo := least(OLD.initiative_id, NEW.initiative_id);
    hi := greatest(OLD.initiative_id, NEW.initiative_id);
  ELSE
    lo := r.initiative_id;
  END IF;
  IF lo IS NOT NULL THEN PERFORM bump_rev('initiative:' || lo, r.project_id); END IF;
  IF hi IS NOT NULL AND hi <> lo THEN PERFORM bump_rev('initiative:' || hi, r.project_id); END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
