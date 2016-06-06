import numpy as np
import matplotlib.pyplot as plt
import json
import urllib

# Either using the api call for an element,
url = "http://xrayplots.2mrd.com.au/api/element/82"

#or a material
url = "http://xrayplots.2mrd.com.au/api/material/water"

response = urllib.urlopen(url)
jsondata = json.load(response)

energies = [point[u'e'] for point in jsondata]
att_coeffs = [point[u'a'] for point in jsondata]
mass_en_abs_coeffs = [point[u'm'] for point in jsondata]

fig = plt.figure()
ax = fig.add_subplot(1, 1, 1)
ax.loglog(energies, att_coeffs, label=r'$\mu/\rho$')
ax.loglog(energies, mass_en_abs_coeffs, label=r'$\mu/\rho_{en}$')
ax.set_xlabel(r'$E \, , \, MeV$')
ax.set_ylabel(r'$\mu/\rho$' + ' or ' + r'$\mu/\rho_{en}, \, cm^2/g$')
plt.legend()
plt.show()
