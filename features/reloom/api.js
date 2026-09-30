export async function requestRecords(action) {
  const response=await fetch('/api/reloom',{method:action?'POST':'GET',credentials:'same-origin',cache:'no-store',...(action?{headers:{'Content-Type':'application/json'},body:JSON.stringify(action)}:{})});
  const body=await response.json();
  if(!response.ok)throw new Error(body.error||'Unable to save. Please try again.');
  return body;
}
export async function loadSharedGarment(id) {
  const response=await fetch(`/api/reloom?story=${encodeURIComponent(id)}`,{cache:'no-store'});
  if(!response.ok)throw new Error('This story is unavailable.');
  return (await response.json()).garment;
}
