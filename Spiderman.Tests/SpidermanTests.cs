using System;
using Xunit;

namespace Wolverine.Tests;

public class SpidermanTests
{
    [Fact]
    public void Constructor_DefaultValues_SetsExpectedProperties()
    {
        var spider = new Spiderman();

        Assert.Equal("Peter Parker", spider.Name);
        Assert.Equal(100, spider.Health);
        Assert.Equal(100, spider.WebFluidLevel);
    }

    [Fact]
    public void Constructor_CustomValues_SetsExpectedProperties()
    {
        var spider = new Spiderman("Miles Morales", 80, 60);

        Assert.Equal("Miles Morales", spider.Name);
        Assert.Equal(80, spider.Health);
        Assert.Equal(60, spider.WebFluidLevel);
    }

    [Fact]
    public void IsAlive_AfterFatalDamage_ReturnsFalse()
    {
        var spider = new Spiderman(health: 10);
        spider.TakeDamage(10);
        Assert.False(spider.IsAlive);
    }

    [Fact]
    public void ShootWeb_DecreasesWebFluidByTen()
    {
        var spider = new Spiderman(webFluidLevel: 50);
        spider.ShootWeb();
        Assert.Equal(40, spider.WebFluidLevel);
    }

    [Fact]
    public void ShootWeb_MultipleTimes_DecreasesCumulatively()
    {
        var spider = new Spiderman(webFluidLevel: 30);
        spider.ShootWeb();
        spider.ShootWeb();
        Assert.Equal(10, spider.WebFluidLevel);
    }
    [Fact]
    public void TakeDamage_ReducesHealth()
    {
        var spider = new Spiderman(health: 100);
        spider.TakeDamage(30);
        Assert.Equal(70, spider.Health);
    }

    [Fact]
    public void TakeDamage_ExceedsHealth_ClampsToZero()
    {
        var spider = new Spiderman(health: 10);
        spider.TakeDamage(999);
        Assert.Equal(0, spider.Health);
    }

    [Fact]
    public void LexLuther_InterceptsWebUsingSuperGirlsDogYo_DecreasesHealth()
    {
        var spider = new Spiderman(health: 80, webFluidLevel: 60);
        spider.LexLuther_InterceptsWebUsingSuperGirlsDogYo();
        Assert.Equal(10, spider.Health);
    }
}