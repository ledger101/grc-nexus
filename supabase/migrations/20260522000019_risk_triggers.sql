-- Migration: 20260522000013_risk_triggers.sql
-- Phase 3 ERM Risk audit trigger attachment.

select audit.attach_audit_trigger('risks');
select audit.attach_audit_trigger('risk_treatments');
