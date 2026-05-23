-- Migration: 20260523000028_incident_triggers.sql
-- Attach immutable audit triggers for phase 7 incident tables.

select audit.attach_audit_trigger('incident_cases');
select audit.attach_audit_trigger('incident_case_events');
select audit.attach_audit_trigger('incident_case_evidence');
