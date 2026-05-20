# DevOps & CI/CD Architecture

## CI/CD Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Developer Push                                                              │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    CONTINUOUS INTEGRATION                             │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │    │
│  │  │Lint &  │  │Unit    │  │Integr. │  │Security│  │Build   │       │    │
│  │  │Format  │  │Tests   │  │Tests   │  │Scan    │  │Docker  │       │    │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    CONTINUOUS DELIVERY                                │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │    │
│  │  │Push to │  │Deploy  │  │Smoke   │  │Deploy  │  │E2E     │       │    │
│  │  │ECR     │  │to Dev  │  │Tests   │  │Staging │  │Tests   │       │    │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    PRODUCTION DEPLOYMENT                              │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │    │
│  │  │Manual  │  │Blue/   │  │Canary  │  │Health  │  │Rollback│       │    │
│  │  │Approval│  │Green   │  │Release │  │Check   │  │Ready   │       │    │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## GitLab CI/CD Configuration

```yaml
# .gitlab-ci.yml

stages:
  - validate
  - test
  - build
  - security
  - deploy-dev
  - deploy-staging
  - deploy-production

variables:
  DOCKER_REGISTRY: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
  EKS_CLUSTER: yummy-${CI_ENVIRONMENT_NAME}
  NODE_IMAGE: node:20-alpine

# ─── VALIDATE STAGE ───────────────────────────────────────────

lint:
  stage: validate
  image: ${NODE_IMAGE}
  script:
    - pnpm install --frozen-lockfile
    - pnpm lint
    - pnpm format:check
  rules:
    - if: $CI_MERGE_REQUEST_IID

typecheck:
  stage: validate
  image: ${NODE_IMAGE}
  script:
    - pnpm install --frozen-lockfile
    - pnpm typecheck
  rules:
    - if: $CI_MERGE_REQUEST_IID

# ─── TEST STAGE ───────────────────────────────────────────────

unit-tests:
  stage: test
  image: ${NODE_IMAGE}
  services:
    - postgres:15
    - redis:7
  variables:
    DATABASE_URL: postgresql://test:test@postgres:5432/yummy_test
    REDIS_URL: redis://redis:6379
  script:
    - pnpm install --frozen-lockfile
    - pnpm test:unit --coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

integration-tests:
  stage: test
  image: ${NODE_IMAGE}
  services:
    - postgres:15
    - redis:7
    - confluentinc/cp-kafka:7.5.0
  script:
    - pnpm install --frozen-lockfile
    - pnpm test:integration
  rules:
    - if: $CI_MERGE_REQUEST_IID

# ─── BUILD STAGE ──────────────────────────────────────────────

build-images:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${DOCKER_REGISTRY}
  script:
    - |
      for service in $(ls apps/services/); do
        docker build -t ${DOCKER_REGISTRY}/yummy-${service}:${CI_COMMIT_SHA} \
          -f apps/services/${service}/Dockerfile .
        docker push ${DOCKER_REGISTRY}/yummy-${service}:${CI_COMMIT_SHA}
      done
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "develop"

# ─── SECURITY STAGE ──────────────────────────────────────────

sast:
  stage: security
  image: returntocorp/semgrep
  script:
    - semgrep --config=auto --json --output=semgrep-results.json .
  artifacts:
    reports:
      sast: semgrep-results.json

container-scan:
  stage: security
  image: aquasec/trivy
  script:
    - |
      for service in $(ls apps/services/); do
        trivy image --severity HIGH,CRITICAL \
          ${DOCKER_REGISTRY}/yummy-${service}:${CI_COMMIT_SHA}
      done
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

dependency-scan:
  stage: security
  image: ${NODE_IMAGE}
  script:
    - pnpm audit --audit-level=high
  allow_failure: true

# ─── DEPLOY DEV ──────────────────────────────────────────────

deploy-dev:
  stage: deploy-dev
  image: bitnami/kubectl:latest
  environment:
    name: development
    url: https://dev.yummy.io
  script:
    - aws eks update-kubeconfig --name ${EKS_CLUSTER} --region ${AWS_REGION}
    - |
      for service in $(ls apps/services/); do
        kubectl set image deployment/yummy-${service} \
          app=${DOCKER_REGISTRY}/yummy-${service}:${CI_COMMIT_SHA} \
          -n yummy-services
      done
    - kubectl rollout status deployment --timeout=300s -n yummy-services
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"

# ─── DEPLOY STAGING ─────────────────────────────────────────

deploy-staging:
  stage: deploy-staging
  image: bitnami/kubectl:latest
  environment:
    name: staging
    url: https://staging.yummy.io
  script:
    - aws eks update-kubeconfig --name ${EKS_CLUSTER} --region ${AWS_REGION}
    - helm upgrade --install yummy ./helm/yummy \
        --namespace yummy-services \
        --set image.tag=${CI_COMMIT_SHA} \
        --set environment=staging \
        --values helm/values-staging.yaml \
        --wait --timeout 600s
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ─── DEPLOY PRODUCTION ──────────────────────────────────────

deploy-production:
  stage: deploy-production
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://app.yummy.io
  script:
    - aws eks update-kubeconfig --name ${EKS_CLUSTER} --region ${AWS_REGION}
    - helm upgrade --install yummy ./helm/yummy \
        --namespace yummy-services \
        --set image.tag=${CI_COMMIT_SHA} \
        --set environment=production \
        --values helm/values-production.yaml \
        --wait --timeout 600s
    # Canary deployment
    - kubectl argo rollouts promote yummy-order-service -n yummy-services
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

## Kubernetes Architecture

### Deployment Example

```yaml
# k8s/services/order-service/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yummy-order-service
  namespace: yummy-services
  labels:
    app: yummy-order-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: yummy-order-service
  template:
    metadata:
      labels:
        app: yummy-order-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: yummy-order-service
      containers:
        - name: app
          image: ${ECR_REGISTRY}/yummy-order-service:latest
          ports:
            - containerPort: 3000
              name: http
            - containerPort: 5000
              name: grpc
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: yummy-db-credentials
                  key: order-service-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: yummy-redis-credentials
                  key: url
            - name: KAFKA_BROKERS
              valueFrom:
                configMapKeyRef:
                  name: yummy-kafka-config
                  key: brokers
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: yummy-order-service
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: yummy-order-service-hpa
  namespace: yummy-services
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: yummy-order-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
```

### Ingress Configuration

```yaml
# k8s/ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: yummy-api-ingress
  namespace: yummy-services
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: ${ACM_CERT_ARN}
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
    alb.ingress.kubernetes.io/wafv2-acl-arn: ${WAF_ACL_ARN}
    alb.ingress.kubernetes.io/healthcheck-path: /health
spec:
  rules:
    - host: api.yummy.io
      http:
        paths:
          - path: /v1/auth
            pathType: Prefix
            backend:
              service:
                name: yummy-auth-service
                port:
                  number: 3000
          - path: /v1/orders
            pathType: Prefix
            backend:
              service:
                name: yummy-order-service
                port:
                  number: 3000
          - path: /v1/menu
            pathType: Prefix
            backend:
              service:
                name: yummy-menu-service
                port:
                  number: 3000
          - path: /v1/payments
            pathType: Prefix
            backend:
              service:
                name: yummy-payment-service
                port:
                  number: 3000
```

## Deployment Strategies

### Blue/Green Deployment
```
┌─────────────────────────────────────────────────────────────┐
│              BLUE/GREEN DEPLOYMENT                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Load Balancer                                               │
│       │                                                       │
│       ├──── 100% ────▶ Blue (v1.2.0) ← Current              │
│       │                                                       │
│       └──── 0% ──────▶ Green (v1.3.0) ← New                 │
│                                                               │
│  After validation:                                           │
│       ├──── 0% ──────▶ Blue (v1.2.0) ← Standby              │
│       │                                                       │
│       └──── 100% ────▶ Green (v1.3.0) ← Active              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Canary Deployment (Argo Rollouts)
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: yummy-order-service
spec:
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 5m }
        - setWeight: 20
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 10m }
        - setWeight: 80
        - pause: { duration: 5m }
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 2
        args:
          - name: service-name
            value: yummy-order-service
```

## Environment Strategy

| Environment | Purpose | Deployment | Data |
|-------------|---------|------------|------|
| Development | Feature development | Auto on push to `develop` | Synthetic |
| Staging | Pre-production validation | Auto on merge to `main` | Anonymized production |
| Production | Live traffic | Manual approval | Real |
| DR | Disaster recovery | Automated failover | Replicated |
