# Lock Down User Layouts

It is now common practice to lock down user layouts such that non-admin users cannot
modify what is on the page. This is especially so with new layouts where grids with
filters and/or "Favorite" carousels are prominent.

This is accomplished by denying `CUSTOMIZE` and `ADD_TAB` permissions in `UP_SYSTEM`.
There are already default versions of files that `GRANT` these permissions in the
`base` data set.

The originals are:

````bash
data/base/permission_set/Authenticated_Users__ADD_TAB__UP_SYSTEM.permission-set.xml
data/base/permission_set/Authenticated_Users__CUSTOMIZE__UP_SYSTEM.permission-set.xml
````

And should be copied to your permission_set data directory, changing target
permission-type to DENY.

```xml
<permission-set script="classpath://org/jasig/portal/io/import-permission_set_v3-1.crn">
  <owner>UP_SYSTEM</owner>
  <principal-type>org.apereo.portal.groups.IEntityGroup</principal-type>
  <principal>
    <group>Authenticated Users</group>
  </principal>
  <activity>ADD_TAB</activity>
  <target permission-type="DENY">
    <literal>ALL</literal>
  </target>
</permission-set>
```

```xml
<permission-set script="classpath://org/jasig/portal/io/import-permission_set_v3-1.crn">
  <owner>UP_SYSTEM</owner>
  <principal-type>org.apereo.portal.groups.IEntityGroup</principal-type>
  <principal>
    <group>Authenticated Users</group>
  </principal>
  <activity>CUSTOMIZE</activity>
  <target permission-type="DENY">
    <literal>ALL</literal>
  </target>
</permission-set>
```
