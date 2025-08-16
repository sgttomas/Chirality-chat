import { DS, SP, X, M } from './contracts';

const clamp = (s: string, max = 800) => 
  s.length > max ? (s.slice(0, max - 1) + '…') : s;

export function compactDS(ds: DS): string {
  const parts = [
    `data_field=${ds.data_field}`,
    ds.units ? `units=${ds.units}` : '',
    ds.type ? `type=${ds.type}` : '',
    ds.source_refs?.length ? `sources=${ds.source_refs.join('; ')}` : '',
    ds.notes ? (Array.isArray(ds.notes) ? `notes=${ds.notes.join(' • ')}` : `notes=${ds.notes}`) : '',
  ].filter(Boolean);
  return clamp(parts.join(' | '), 600);
}

export function compactSP(sp: SP): string {
  const parts = [
    `step=${sp.step}`,
    sp.purpose ? `purpose=${sp.purpose}` : '',
    sp.inputs ? (Array.isArray(sp.inputs) ? `inputs=${sp.inputs.join(',')}` : `inputs=${sp.inputs}`) : '',
    sp.outputs ? (Array.isArray(sp.outputs) ? `outputs=${sp.outputs.join(',')}` : `outputs=${sp.outputs}`) : '',
    sp.preconditions ? (Array.isArray(sp.preconditions) ? `pre=${sp.preconditions.join(',')}` : `pre=${sp.preconditions}`) : '',
    sp.postconditions ? (Array.isArray(sp.postconditions) ? `post=${sp.postconditions.join(',')}` : `post=${sp.postconditions}`) : '',
  ].filter(Boolean);
  return clamp(parts.join(' | '), 700);
}

export function compactX(x: X): string {
  const parts = [
    `heading=${x.heading}`,
    clamp(x.narrative, 500),
    x.precedents ? (Array.isArray(x.precedents) ? `precedents=${x.precedents.join(',')}` : `precedents=${x.precedents}`) : '',
    x.successors ? (Array.isArray(x.successors) ? `successors=${x.successors.join(',')}` : `successors=${x.successors}`) : '',
  ].filter(Boolean);
  return clamp(parts.join(' | '), 800);
}

export function compactM(m: M): string {
  const parts = [
    `statement=${m.statement}`,
    m.justification ? clamp(`justification=${m.justification}`, 400) : '',
    m.assumptions
      ? Array.isArray(m.assumptions)
        ? `assumptions=${m.assumptions.join(',')}`
        : `assumptions=${m.assumptions}`
      : '',
    m.residual_risk
      ? Array.isArray(m.residual_risk)
        ? `residual_risk=${m.residual_risk.join(',')}`
        : `residual_risk=${m.residual_risk}`
      : '',
  ].filter(Boolean);
  return clamp(parts.join(' | '), 700);
}