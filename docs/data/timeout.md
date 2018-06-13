# Session timeout by Group

Session timeout can be configured on a group by group basis. This is done
through the `MAX_INACTIVE` permission. This value defines the maximum
inactive time in seconds before the user in this group is prompted to stay
logged in or their session closed.

Below is an example for Staff with a timeout of 8 hours.

```xml
<permission-set script="classpath://org/jasig/portal/io/import-permission_set_v3-1.crn">
  <principal-type>org.jasig.portal.groups.IEntityGroup</principal-type>
  <principal>
    <group>Staff</group>
  </principal>
  <activity>MAX_INACTIVE</activity>
  <target permission-type="GRANT">
  <literal>28800</literal>
  </target>
</permission-set>
```