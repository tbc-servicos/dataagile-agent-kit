from pathlib import Path
from jinja2 import Environment, FileSystemLoader

def generate_bo(spec: dict) -> str:
    """
    Generates TLPP IntegratedProvider code from a spec dictionary.

    Args:
        spec: Dictionary containing namespace, className, displayName, description,
              area, team, country, initialRelease, tables, fields, params

    Returns:
        String containing the generated TLPP code
    """
    env = Environment(
        loader=FileSystemLoader(Path(__file__).parent / 'templates'),
        autoescape=False
    )
    template = env.get_template('integratedprovider.tlpp.j2')
    return template.render(spec)
