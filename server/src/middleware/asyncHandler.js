// Wikkelt een async route-handler zodat afgewezen promises naar Express'
// foutafhandeling gaan i.p.v. het proces te laten crashen (Express 4 vangt
// async fouten niet automatisch op).
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
