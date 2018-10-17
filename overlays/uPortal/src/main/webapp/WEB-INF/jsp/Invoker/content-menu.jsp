<%--

    Licensed to Apereo under one or more contributor license
    agreements. See the NOTICE file distributed with this work
    for additional information regarding copyright ownership.
    Apereo licenses this file to you under the Apache License,
    Version 2.0 (the "License"); you may not use this file
    except in compliance with the License.  You may obtain a
    copy of the License at the following location:

      http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.

--%>
<%@ include file="/WEB-INF/jsp/include.jsp" %>

<c:set var="request" value="${pageContext.request}" />
<c:set var="ctxPath" value="${request.contextPath}" />

<script src="/resource-server/webjars/vue/dist/vue.min.js"></script>
<script src="/resource-server/webjars/uportal__esco-content-menu/dist/esco.min.js" defer></script>

<div id="content-menu">
  <esco-hamburger-menu
    context-api-url="${ctxPath}"
    sign-out-url="${portalLogoutUrl[0]}"
    default-org-logo="${alternativeBanner[0]}"
    favorite-api-url="${favoriteApiUrl[0]}"
    layout-api-url="${layoutApiUrl[0]}"
    organization-api-url="${organizationApiUrl[0]}"
    portlet-api-url="${portletApiUrl[0]}"
    user-info-api-url="${userInfoApiUrl[0]}"
    user-info-portlet-url="${moreUserInfoUrl[0]}"
    switch-org-portlet-url="${orgInfoUrl[0]}"
    favorites-portlet-card-size="${favoritesPortletCardSize[0]}"
    grid-portlet-card-size="${gridPortletCardSize[0]}"
    hide-action-mode="${hideActionMode[0]}"
    show-favorites-in-slider="true"
  ></esco-hamburger-menu>
</div>

<script type="text/javascript">
  /** this part is needed to move the menu on left from uPortal menu. */
  if (!Element.prototype.matches)
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector;
  if (!Element.prototype.closest)
    Element.prototype.closest = function(s) {
      var el = this;
      if (!document.documentElement.contains(el)) return null;
      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null);
      return null;
    };
  document.querySelector('#content-menu').closest("section").setAttribute("style", "float: left;");
</script>

<c:if test="${hidePortalNav[0]}">
<style type="text/css">
  .portal .row-offcanvas #wrapper .portal-header #up-sticky-nav .portal-global a.menu-toggle, .portal .row-offcanvas #wrapper .portal-header nav.portal-nav {
    display: none;
  }
  .portal .row-offcanvas.active {
    transform: none;
  }
</style>
</c:if>
