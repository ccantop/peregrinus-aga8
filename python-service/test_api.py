import pyaga8

print("Composition attrs:", [a for a in dir(pyaga8.Composition()) if not a.startswith('_')])

comp = pyaga8.Composition()
print("comp type:", type(comp))
print("comp:", comp)
