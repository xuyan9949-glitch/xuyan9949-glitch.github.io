# MU magazine reading prototype

Demo only. Production pages and the approved homepage remain unchanged.

Company information has four compact views. Both long manuscripts open in a separate reader with one toolbar for return, contents, settings and original Word download. Contents and settings start closed. Readers can use five editorial parts or continuous full text.

The build script slices the existing manuscript HTML at original headings. It checks that concatenating the slices reproduces the exact source in order; it also checks the source-note transformation preserves text. No manuscript file or research registry is modified. The business role illustration and story pull quote are additional presentation elements grounded in the existing text. The cover remains a labeled industry illustration.

Build: `python tools/build_mu_magazine_demo.py`.

Verification: all company tabs, ten article parts, closed menus, chapter navigation, continuous text, return paths and original Word links passed DOM interaction checks. Real browser visual verification remains with the user preview. The demo remembers the last opened editorial part when browser storage is available, not the exact paragraph scroll position.
