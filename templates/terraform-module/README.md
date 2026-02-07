# Terraform Module Template

Use this template as a starting point for new Terraform modules.

## Structure
```
modules/<module-name>/
├── main.tf           # Main resources
├── variables.tf      # Input variables
├── outputs.tf        # Output values
├── versions.tf       # Provider requirements
└── README.md         # Module documentation
```

## Usage

Copy this template and rename the module directory:
```bash
cp -r templates/terraform-module modules/<your-module-name>
```

## Conventions
- Use snake_case for resource names
- Prefix all resources with `var.project_name` and `var.environment`
- Add descriptions to all variables
- Use `locals` for computed values
- Tag all resources with standard tags
