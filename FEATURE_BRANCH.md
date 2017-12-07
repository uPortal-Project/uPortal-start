(This is a temporary file documenting the intentions and todos of this feature branch.)

# Intention

Enhance `uPortal-start` so that an adopter need only do modest, friendly, well-documented configuration to at least demonstrate `uPortal-home` running alongside and using the uPortal in `uPortal-start`.

So in-scope is something like 

+ there's a reasonable checklist of stuff to do to configure uPortal-start to use uPortal-home. Feature flags. An additional entities folder to source. 
+ Run the `uPortal-start` `portalInit` task. Start tomcat. Tada! Exercise uPortal-home in browser.

Out of current scope is

+ deeper considerations of where you go from there to productionize.

# Todo

Capturing hypotheses about what needs doing, given evidence from e.g. browser 
JavaScript console errors.

+ uPortal-home expects a KeyValueStore. Either stop needing it, fail gracefully 
without it, or add and configure the microservice.
+ Problem sourcing groups
+ Problem sourcing layout
+ Problem sourcing user attributes from session.json
+ Add a fragment for uPortal-home to use to store home page layout.
+ Add entities with widget metadata to demonstrate widgets etc.
+ Add a `uPortal-home` profile
+ Mod rendering pipeline to prefer `uPortal-home` when using the `uPortal-home` profile.
+ Considerations for selecting that `uPortal-home` profile. By group? Maybe a 
feature flag that enumerates what groups ought to get this profile? Maybe 
nothing to do here and just rely on already existing infrastructure for 
defaulting, selecting profiles?
