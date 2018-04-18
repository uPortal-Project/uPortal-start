# Intégrations

uPortal, comme de nombreuses applications Web qui aggrègent des services,
fait face à des défis avec l'intégration. Ici, nous collectons des solutions
à partager avec les intégrateurs.

## La liste blanche de sécurité CORS

Le filtre CORS (Cross-Origin Resource Sharing) dans uPortal restreint
les POST provenant de code provenant d'autres serveurs. Cette restriction
peut interférer avec les services frontaux, tels que CAS et Shibboleth.

Cela peut être atténué par les services de liste blanche pour le filtre CORS.
Dans `uPortal.properties`, ajoutez les services pouvant être redirigés vers uPortal 
dans la propriété suivante :

```properties
cors.allowed.origins=https://idp.myschool.edu, https://cas.myschool.edu
```

Dans l'exemple ci-dessus, deux services sont ajoutés à la liste blanche. Dans un cas réel,
un seul CAS ou Shib serait utilisé. Notez également que le protocole
doit être spécifié.

Voir : [CORS](https://developer.mozilla.org/fr/docs/Web/HTTP/Access_control_CORS)
