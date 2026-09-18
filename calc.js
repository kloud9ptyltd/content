/* calc.js — pure money-math for The Money Map.
   Sets globalThis.CALC. No DOM, no state, no dependencies. */
(function () {
  'use strict';

  // Treat missing / invalid / negative input as 0. Numeric strings are coerced first
  // (page inputs arrive as strings): trims, strips $ / spaces / thousands commas.
  // '1e5' parses; '12px' does not (full-string check, never bare parseFloat).
  function n0(x) {
    if (typeof x === 'number') {
      if (!isFinite(x) || x < 0) return 0;
      return x === 0 ? 0 : x; // normalise -0
    }
    if (typeof x === 'string') {
      var s = x.trim().replace(/[$\s,]/g, '');
      if (s === '' || !/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(s)) return 0;
      var v = Number(s);
      if (!isFinite(v) || v < 0) return 0;
      return v === 0 ? 0 : v; // normalise -0, reject negatives
    }
    return 0; // undefined, null, booleans, objects, arrays
  }

  function split(takeHome) {
    var t = n0(takeHome);
    return {
      essentials: t * 0.50,
      investing: t * 0.20,
      emergency: t * 0.10,
      lifestyle: t * 0.15,
      buffer: t * 0.05,
      total: t
    };
  }

  function guardrails(input) {
    var o = input || {};
    var t = n0(o.takeHome);
    var caps = { rent: 30, car: 10, essentials: 50 };
    var out = {};
    ['rent', 'car', 'essentials'].forEach(function (k) {
      var amount = n0(o[k]);
      var pct = t === 0 ? 0 : (amount / t) * 100;
      var cap = caps[k];
      var capAmount = t * cap / 100;
      out[k] = {
        amount: amount,
        pct: pct,
        cap: cap,
        capAmount: capAmount,
        // at takeHome 0 and amount 0 → true (nothing to breach)
        ok: amount <= capAmount
      };
    });
    return out;
  }

  function emergencyFund(input) {
    var o = input || {};
    var monthlyEssentials = n0(o.monthlyEssentials);
    var months = o.months === undefined ? 6 : n0(o.months);
    var saved = n0(o.saved);
    var contribution = n0(o.monthlyContribution);

    var target = monthlyEssentials * months;
    var remaining = Math.max(0, target - saved);
    var pctFunded = target === 0 ? 0 : Math.min(100, saved / target * 100);

    var monthsToFull;
    if (remaining === 0) {
      monthsToFull = 0;
    } else if (contribution <= 0) {
      monthsToFull = null;
    } else {
      monthsToFull = Math.ceil(remaining / contribution);
    }

    return {
      target: target,
      saved: saved,
      remaining: remaining,
      pctFunded: pctFunded,
      monthsToFull: monthsToFull
    };
  }

  function freedom(input) {
    var o = input || {};
    var monthlyExpenses = n0(o.monthlyExpenses);
    var invested = n0(o.invested);
    var monthlyInvestment = n0(o.monthlyInvestment);
    var annualReturnPct = o.annualReturnPct === undefined ? 5 : n0(o.annualReturnPct);

    var annualExpenses = monthlyExpenses * 12;
    var number = annualExpenses * 25;
    var cautiousNumber = annualExpenses * 30;

    var monthsToFreedom = null;
    var yearsToFreedom = null;

    if (invested >= number) {
      monthsToFreedom = 0;
      yearsToFreedom = 0;
    } else {
      var r = annualReturnPct / 100 / 12;
      var balance = invested;
      for (var m = 1; m <= 1200; m++) {
        balance = balance * (1 + r) + monthlyInvestment; // contribution at end of month
        if (balance >= number) {
          monthsToFreedom = m;
          yearsToFreedom = Math.round((m / 12) * 10) / 10;
          break;
        }
      }
      // never reached within 1200 months → leave both null
    }

    return {
      annualExpenses: annualExpenses,
      number: number,
      cautiousNumber: cautiousNumber,
      yearsToFreedom: yearsToFreedom,
      monthsToFreedom: monthsToFreedom
    };
  }

  globalThis.CALC = {
    split: split,
    guardrails: guardrails,
    emergencyFund: emergencyFund,
    freedom: freedom
  };
})();
