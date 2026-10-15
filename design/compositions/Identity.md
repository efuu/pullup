# Identity

PullUp has no accounts. The first time a browser does anything it
[claims a name](reaction:Identity.Claiming.Claim) and receives a secret, which the
browser keeps and sends with every later request. Any request that needs to know who
is asking resolves that secret through Identifying first, so a caller can never name
a different user than the one the secret identifies.

```endpoints
Identity.Claiming.Claim at /me/claim
```

A browser can [ask who it is](reaction:Identity.Claiming.Current), which the frontend
uses on load to decide whether to show the name prompt.

```endpoints
Identity.Claiming.Current at /me/current
```
