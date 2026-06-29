from django.contrib import admin
from . import models as m

for _name in dir(m):
    _obj = getattr(m, _name)
    try:
        if (isinstance(_obj, type) and issubclass(_obj, m.models.Model)
                and _obj._meta.app_label == 'patients'
                and not _obj._meta.abstract):
            admin.site.register(_obj)
    except Exception:
        pass
