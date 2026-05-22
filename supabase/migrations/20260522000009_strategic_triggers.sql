-- Migration: 20260522000009_strategic_triggers.sql
-- Phase 2: Attach audit triggers to strategic planning tables.
-- audit.attach_audit_trigger() is defined in Phase 1 migration 000003.
-- Tables must exist (migration 000007 runs first) before triggers can be attached.

select audit.attach_audit_trigger('strategic_objectives');
select audit.attach_audit_trigger('kpis');
select audit.attach_audit_trigger('kpi_readings');
