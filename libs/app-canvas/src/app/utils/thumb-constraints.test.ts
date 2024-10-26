import { areThumbconstraintsCompatible } from '../utils/thumb-constraints';

describe('areThumbconstraintsCompatible', () => {
  it('returns true when taskThumbConstraint is undefined', () => {
    const result = areThumbconstraintsCompatible(undefined, 'constraint');
    expect(result).toBe(true);
  });

  it('returns true when taskThumbConstraint and nodeThumbConstraint are equal strings', () => {
    const result = areThumbconstraintsCompatible('constraint', 'constraint');
    expect(result).toBe(true);
  });

  it('returns true when taskThumbConstraint and nodeThumbConstraint are equal arrays', () => {
    const result = areThumbconstraintsCompatible(
      ['constraint1', 'constraint2'],
      ['constraint1', 'constraint2']
    );
    expect(result).toBe(true);
  });

  it('returns true when taskThumbConstraint is undefined and nodeThumbConstraint is undefined', () => {
    const result = areThumbconstraintsCompatible(undefined, undefined);
    expect(result).toBe(true);
  });

  it('returns true when taskThumbConstraint is an array and nodeThumbConstraint is a string included in the array', () => {
    const result = areThumbconstraintsCompatible(
      ['constraint1', 'constraint2'],
      'constraint1'
    );
    expect(result).toBe(true);
  });

  it('returns false when taskThumbConstraint and nodeThumbConstraint are different strings', () => {
    const result = areThumbconstraintsCompatible('constraint1', 'constraint2');
    expect(result).toBe(false);
  });

  it('returns false when taskThumbConstraint is an array and nodeThumbConstraint is a string not included in the array', () => {
    const result = areThumbconstraintsCompatible(
      ['constraint1', 'constraint2'],
      'constraint3'
    );
    expect(result).toBe(false);
  });
});
