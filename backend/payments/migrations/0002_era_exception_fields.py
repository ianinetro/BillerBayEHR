from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="eraexception",
            name="charged_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="eraexception",
            name="adjustment_group",
            field=models.CharField(blank=True, default="", max_length=10),
        ),
        migrations.AddField(
            model_name="eraexception",
            name="remark_code",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AlterField(
            model_name="eraexception",
            name="cpt_code",
            field=models.CharField(blank=True, default="", max_length=10),
        ),
        migrations.AlterField(
            model_name="eraexception",
            name="adjustment_reason",
            field=models.CharField(blank=True, default="", max_length=500),
        ),
    ]
